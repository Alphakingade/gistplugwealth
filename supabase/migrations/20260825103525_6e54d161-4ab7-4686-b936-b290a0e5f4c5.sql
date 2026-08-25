-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin');
CREATE TYPE public.article_status AS ENUM ('draft', 'published');

-- UPDATED AT HELPER
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- NEW USER TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CATEGORIES
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  featured_image TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are public" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- TAGS
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO authenticated;
GRANT ALL ON public.tags TO service_role;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tags are public" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Admins manage tags" ON public.tags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ARTICLES
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL DEFAULT '',
  featured_image TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT 'GistPlugWealth Editorial',
  status public.article_status NOT NULL DEFAULT 'draft',
  featured BOOLEAN NOT NULL DEFAULT false,
  popular BOOLEAN NOT NULL DEFAULT false,
  trending BOOLEAN NOT NULL DEFAULT false,
  read_minutes INTEGER NOT NULL DEFAULT 4,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);
CREATE INDEX articles_status_published_idx ON public.articles (status, published_at DESC);
CREATE INDEX articles_category_idx ON public.articles (category_id);
GRANT SELECT ON public.articles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.articles TO authenticated;
GRANT ALL ON public.articles TO service_role;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published articles are public" ON public.articles FOR SELECT USING (status = 'published');
CREATE POLICY "Admins read all articles" ON public.articles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage articles" ON public.articles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER articles_updated_at BEFORE UPDATE ON public.articles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ARTICLE TAGS
CREATE TABLE public.article_tags (
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);
GRANT SELECT ON public.article_tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.article_tags TO authenticated;
GRANT ALL ON public.article_tags TO service_role;
ALTER TABLE public.article_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Article tags are public" ON public.article_tags FOR SELECT USING (true);
CREATE POLICY "Admins manage article tags" ON public.article_tags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- NEWSLETTER
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'subscribed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.newsletter_subscribers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read subscribers" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage subscribers" ON public.newsletter_subscribers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- CONTACT MESSAGES
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can send a message" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read messages" ON public.contact_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage messages" ON public.contact_messages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- SITE SETTINGS
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings are public" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage settings" ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.site_settings (key, value) VALUES
  ('whatsapp_url', ''),
  ('contact_email', ''),
  ('twitter_url', ''),
  ('facebook_url', ''),
  ('instagram_url', ''),
  ('tiktok_url', ''),
  ('youtube_url', '');

-- SEED CATEGORIES
INSERT INTO public.categories (name, slug, description, icon, sort_order) VALUES
  ('Saving Money', 'saving-money', 'Practical ways to spend less, budget better and grow your savings in Nigeria.', 'PiggyBank', 1),
  ('Side Hustles', 'side-hustles', 'Legitimate side income ideas you can start alongside school or a full-time job.', 'HandCoins', 2),
  ('Student Finance', 'student-finance', 'Money guides built for Nigerian students: budgeting, earning and studying smart.', 'GraduationCap', 3),
  ('Apps', 'apps', 'Reviews and guides on the payment, savings and investment apps Nigerians use.', 'Smartphone', 4),
  ('Online Business', 'online-business', 'Building, running and growing a business online from Nigeria.', 'ShoppingBag', 5),
  ('Making Money in Nigeria', 'making-money-in-nigeria', 'Real opportunities to earn more income within the Nigerian economy.', 'TrendingUp', 6),
  ('Personal Finance', 'personal-finance', 'Everyday money management, planning and financial habits that compound.', 'Wallet', 7),
  ('Investments', 'investments', 'Understanding investment options available to Nigerians, and their risks.', 'LineChart', 8),
  ('AI & Business', 'ai-and-business', 'AI tools and workflows Nigerian businesses can use today.', 'Sparkles', 9),
  ('Resources', 'resources', 'Tools, templates and useful links for your money and business journey.', 'BookOpen', 10);

-- SEED TAGS
INSERT INTO public.tags (name, slug) VALUES
  ('Make Money Online', 'make-money-online'),
  ('Students', 'students'),
  ('Savings', 'savings'),
  ('Fintech', 'fintech'),
  ('Affiliate Marketing', 'affiliate-marketing'),
  ('AI Tools', 'ai-tools'),
  ('Freelancing', 'freelancing'),
  ('Digital Products', 'digital-products'),
  ('Dollars', 'dollars'),
  ('Budgeting', 'budgeting');

-- SEED ARTICLES
INSERT INTO public.articles (title, slug, excerpt, content, category_id, status, featured, popular, trending, read_minutes, seo_title, seo_description, published_at)
VALUES
(
  'How to Make Money Online in Nigeria: A Practical Starter Guide',
  'how-to-make-money-online-in-nigeria',
  'A realistic breakdown of the online income paths that actually work in Nigeria, what each one requires, and how to pick the right one for your situation.',
  E'## Start with what you already have\n\nMost people looking to earn online in Nigeria start by asking "what pays the most?" That is the wrong first question. The better question is: what can I do consistently with the phone, laptop, time and skills I already have?\n\n## The paths that actually work\n\n- **Freelancing** — writing, design, virtual assistance, video editing. You trade skill for money, and you can start this week if you already have a skill.\n- **Affiliate marketing** — you promote products and earn a commission. Slow at first, compounding later.\n- **Digital products** — ebooks, templates, courses. High effort upfront, sells repeatedly afterwards.\n- **Content creation** — YouTube, TikTok, blogging. Monetises late, but builds an asset.\n- **Remote work** — a full remote role with a Nigerian or foreign company.\n\n> Anything promising fixed daily returns for simply depositing money is not an online business. It is a scheme. Walk away.\n\n## What you need in place\n\n1. A working smartphone or laptop and reliable data.\n2. A bank account plus a way to receive foreign payments if you plan to serve clients abroad.\n3. A skill you can name in one sentence.\n4. A place to show your work: a simple portfolio, a WhatsApp catalogue, or a social profile.\n\n## A 30-day plan\n\n**Week 1:** pick one path and one skill. Do not pick three.\n**Week 2:** build two sample pieces of work.\n**Week 3:** reach out to ten potential clients or publish your first three pieces of content.\n**Week 4:** review what got responses and repeat that.\n\n## Be patient with the money\n\nFirst income online is usually small. That is normal. The point of the first ₦20,000 is not the ₦20,000 — it is the proof that the system works, so you can repeat and scale it.',
  (SELECT id FROM public.categories WHERE slug = 'making-money-in-nigeria'),
  'published', true, true, true, 7,
  'How to Make Money Online in Nigeria (Practical Guide)',
  'A realistic guide to earning online in Nigeria: freelancing, affiliate marketing, digital products and remote work, plus a 30-day starter plan.',
  now() - interval '1 day'
),
(
  'Best Side Hustles for Students in Nigeria',
  'best-side-hustles-for-students-in-nigeria',
  'Side hustles that fit around lectures, need little or no capital, and can grow into something bigger after graduation.',
  E'## Choose a hustle that fits your timetable\n\nA side hustle that clashes with lectures will not survive the semester. Before choosing, map your free hours honestly.\n\n## Low-capital options\n\n- **Tutoring** — secondary school students, JAMB prep, or coursemates. Pays quickly.\n- **Freelance writing or design** — paid per project, done from your hostel.\n- **Campus reselling** — data, snacks, thrift, accessories. Small margins, fast turnover.\n- **Social media management** — for small campus businesses that have no time to post.\n- **Photography and content editing** — events happen on campus every weekend.\n\n## Options that need a small budget\n\n- Printing and stationery services\n- Laundry and delivery services\n- Small-scale food vending\n\n## Protect your studies\n\nCap your hustle hours. Track what you earn per hour, not just per month — a hustle that pays ₦15,000 but eats 60 hours is worse than one paying ₦10,000 for 10 hours.\n\n## Reinvest early\n\nThe biggest mistake students make is spending 100% of early hustle income. Send a fixed share into savings each time you get paid, even if it is only ten percent.',
  (SELECT id FROM public.categories WHERE slug = 'student-finance'),
  'published', true, true, false, 5,
  'Best Side Hustles for Students in Nigeria',
  'Practical, low-capital side hustles Nigerian students can start around lectures, with tips on protecting your studies and reinvesting income.',
  now() - interval '2 day'
),
(
  'How to Receive Dollars in Nigeria Without Losing Money',
  'how-to-receive-dollars-in-nigeria',
  'The main ways Nigerians receive foreign payments, what each one costs, and how to avoid the mistakes that get accounts restricted.',
  E'## Why this matters\n\nIf you freelance, sell digital products or work remotely, how you receive money can quietly cost you a large share of your income in fees and poor rates.\n\n## Common options\n\n- **Domiciliary account** — a foreign-currency account with a Nigerian bank. Best for larger, regular inflows.\n- **International payment platforms** — useful for freelance clients, but check the fee and the rate separately.\n- **Nigerian fintech apps offering virtual accounts** — convenient, but confirm the provider is licensed and read the limits.\n- **Direct bank transfer** — slower, sometimes cheaper for large amounts.\n\n## Always compare two numbers\n\n1. The transfer fee.\n2. The exchange rate applied.\n\nA "zero fee" service with a poor rate can be more expensive than a service charging a visible fee.\n\n## Keep your account healthy\n\n- Use your real name and matching documents everywhere.\n- Do not use a personal payment account for third-party funds.\n- Keep invoices and records; platforms may ask for proof of the source of funds.\n\n> This is general information, not financial or tax advice. Confirm current rules with your bank or a qualified professional.',
  (SELECT id FROM public.categories WHERE slug = 'personal-finance'),
  'published', false, true, true, 6,
  'How to Receive Dollars in Nigeria (Fees and Options)',
  'Compare domiciliary accounts, fintech apps and payment platforms for receiving dollars in Nigeria, and avoid costly fees and account restrictions.',
  now() - interval '3 day'
),
(
  'Best Payment Apps for Nigerians in 2026',
  'best-payment-apps-for-nigerians',
  'What to look for in a payment app, the categories that matter, and the questions to ask before you trust any app with your money.',
  E'## Judge apps on four things\n\n1. **Licensing** — is the provider licensed by the CBN or partnered with a licensed bank?\n2. **Reliability** — does it work during peak periods?\n3. **Cost** — transfer fees, card fees, maintenance charges.\n4. **Support** — can a real human resolve a failed transaction?\n\n## The categories\n\n- **Everyday transfers and bills** — your main spending account.\n- **Savings and locked savings** — for money you should not touch.\n- **Investment apps** — for longer-term money, with real risk disclosure.\n- **Business collections** — payment links, POS, invoicing.\n\n## Safety habits that matter more than the app\n\n- Turn on two-factor authentication.\n- Never share OTPs, even with "support".\n- Keep a second app funded as a backup during downtime.\n- Withdraw and confirm small amounts before moving large ones to a new platform.\n\n> Any platform promising guaranteed high daily or weekly returns should be treated as high risk regardless of how polished the app looks.',
  (SELECT id FROM public.categories WHERE slug = 'apps'),
  'published', false, true, false, 5,
  'Best Payment Apps for Nigerians: How to Choose',
  'How to evaluate Nigerian payment, savings and investment apps on licensing, reliability, cost and support, plus safety habits that protect your money.',
  now() - interval '4 day'
),
(
  'How to Start Affiliate Marketing in Nigeria',
  'how-to-start-affiliate-marketing-in-nigeria',
  'A step-by-step introduction to affiliate marketing for Nigerians: choosing a niche, finding programmes, and earning your first commission honestly.',
  E'## What affiliate marketing really is\n\nYou recommend a product, someone buys through your link, and you earn a commission. That is the whole model. Everything else is execution.\n\n## Step 1: Pick a niche you can talk about weekly\n\nFinance apps, gadgets, online courses, fashion, software. If you cannot imagine writing about it fifty times, choose something else.\n\n## Step 2: Find programmes\n\nLocal marketplaces, international networks and individual software companies all run affiliate programmes. Check the commission, the cookie period and how they pay Nigerians.\n\n## Step 3: Build one channel properly\n\nA blog, a YouTube channel, a TikTok account or an email list. One, done well, beats five neglected ones.\n\n## Step 4: Create content that solves a problem\n\nComparisons, tutorials, honest reviews and "best X for Y" guides convert best because they meet someone already deciding.\n\n## Step 5: Disclose your links\n\nTell readers when a link is an affiliate link. It is the honest thing to do and it builds the trust that makes people buy through you again.\n\n## What to expect\n\nMost affiliates earn nothing in month one. Income tends to arrive after you have a body of content that keeps working while you sleep.',
  (SELECT id FROM public.categories WHERE slug = 'online-business'),
  'published', false, false, true, 6,
  'How to Start Affiliate Marketing in Nigeria (Beginners)',
  'Learn affiliate marketing in Nigeria step by step: picking a niche, finding programmes that pay Nigerians, creating content and disclosing links.',
  now() - interval '5 day'
),
(
  'Simple Ways to Save Money in Nigeria When Prices Keep Rising',
  'how-to-save-money-in-nigeria',
  'Saving is harder when costs rise faster than income. These are the practical adjustments that still work.',
  E'## Start by seeing the money\n\nFor two weeks, record every naira that leaves your hands. Most people are surprised by two or three categories they had never counted.\n\n## Save first, spend after\n\nMove your savings out on the day money arrives, not at month end. What stays in the spending account gets spent.\n\n## Cut the quiet costs\n\n- Unused subscriptions\n- Frequent small transfers that carry fees\n- Daily convenience purchases that add up\n- Transport patterns that could be batched\n\n## Buy differently, not just less\n\nBuying staple foods in bulk, planning market trips and cooking in batches usually saves more than cutting small treats.\n\n## Keep an emergency buffer\n\nEven ₦20,000 set aside prevents a small problem from becoming a debt. Build the buffer before any investment.\n\n## Protect savings from yourself\n\nUse a locked savings product or a separate account you do not carry a card for. Friction is a feature.\n\n> Information here is educational only and does not account for your personal circumstances.',
  (SELECT id FROM public.categories WHERE slug = 'saving-money'),
  'published', false, false, false, 5,
  'How to Save Money in Nigeria Despite Rising Prices',
  'Practical saving strategies for Nigerians: tracking spending, saving first, cutting quiet costs, buying in bulk and building an emergency buffer.',
  now() - interval '6 day'
);

INSERT INTO public.article_tags (article_id, tag_id)
SELECT a.id, t.id FROM public.articles a, public.tags t
WHERE (a.slug = 'how-to-make-money-online-in-nigeria' AND t.slug IN ('make-money-online','freelancing','digital-products'))
   OR (a.slug = 'best-side-hustles-for-students-in-nigeria' AND t.slug IN ('students','make-money-online'))
   OR (a.slug = 'how-to-receive-dollars-in-nigeria' AND t.slug IN ('dollars','fintech'))
   OR (a.slug = 'best-payment-apps-for-nigerians' AND t.slug IN ('fintech','savings'))
   OR (a.slug = 'how-to-start-affiliate-marketing-in-nigeria' AND t.slug IN ('affiliate-marketing','make-money-online'))
   OR (a.slug = 'how-to-save-money-in-nigeria' AND t.slug IN ('savings','budgeting'));