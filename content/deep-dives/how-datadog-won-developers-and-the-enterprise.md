---
date: 2026-10-07
dek: The pricing, product, and sales choices that made Datadog too valuable to sell.
---

On September 18, 2019, Datadog priced its IPO at $27 a share, above a range it had already raised once. The next morning the stock opened at $40.35. By the close, the New York monitoring company was worth about $10.9 billion, according to Forbes.

It almost went another way. Weeks earlier, Bloomberg reported, Cisco had approached Datadog with a takeover offer "significantly higher" than the $7 billion valuation it was aiming for. Datadog said no, because it believed it would be worth more as a public company over time.

Cisco had done this before. In 2017 it bought AppDynamics, an application monitoring company, for $3.7 billion, two nights before AppDynamics was due to go public.

Nine years earlier, almost nobody wanted Datadog at any price. "None of the West Coast investors were listening," co-founder and CEO Olivier Pomel told TechCrunch, which reported that some of them saw starting an infrastructure company in New York as a "form of mental impairment."

In October 2012, Shardul Shah of Index Ventures met Pomel on a park bench near the company's sublet office in Manhattan. By Shah's account, Datadog had eight employees and "less than $20k of revenue."

By the IPO, it had 8,846 customers. The 594 of them paying more than $100,000 a year made up about 72% of its recurring revenue.

The cloud is the obvious explanation, and it explains a lot. It doesn't explain why the startups that rode the same wave sold for tens of millions while Datadog turned down billions.

**What Datadog did was simpler and harder to copy: it got onto every server, became the first place everyone looked when something broke, and sold them what they found there.**

This deep dive is about how that machine was built: what the founders saw, how they priced, why they waited to compete with the tools they started out plugging into, and where the machine stops working.

For anyone who owns pipeline, it's also a 16-year case study in growing a business without asking a single customer to rip anything out on day one.

## Every Team Had Its Own Version of the Truth

Pomel and Alexis Lê-Quôc met as undergraduates in France. TechCrunch tells the story of their first real encounter: Pomel ran the campus network, found out that Lê-Quôc had hacked it, and Lê-Quôc got disconnected.

They kept ending up in the same places anyway. Their 2019 founders' letter lists IBM Research, a company called Neomeo, and then Wireless Generation, a New York company that sold software to K-12 schools.

At Wireless Generation, Pomel ran development and Lê-Quôc ran operations. That split is the origin of everything that followed.

Developers write the code. Operations keeps it running. And when something breaks at 2 a.m., each side opens its own tools, looks at its own data, and finds the problem on the other side of the wall.

Pomel described it more bluntly: "developers that hated operations, operations that hated developers, finger-pointing."

Lê-Quôc called the monitoring market of 2010 "a very fractured environment." Each part of the stack, from databases to network gear to servers, had its own monitoring tool. Operations had "probably too many tools," he told Software Engineering Daily in 2018, while developers had almost nothing.

**The problem wasn't a lack of data. Every team had its own version of the truth, and no way to reconcile them in the middle of an outage.**

Then the cloud made it worse.

In 2010, renting servers from Amazon by the hour still felt experimental, but the direction was clear. A physical server used to be bought and depreciated over three years. A cloud instance could live for a few hours. Containers would later cut that to minutes.

That changed what monitoring had to do. Tools built for a few hundred long-lived machines with names couldn't keep track of thousands of short-lived ones. And every new cloud service came with another dashboard to check.

The founders didn't see the full size of it yet. "We didn't quite understand at the time that the cloud was going to be so big," Pomel said later. What they did understand was the fight between the two teams, and that the cloud was about to put both of them under more pressure.

"Bringing dev and ops together is not a feature, it is core," Pomel told TechCrunch.

They incorporated in June 2010 and named the company after an Oracle database their old team had dreaded, called Datadog17. They dropped the 17.

Then they did something unusual for two engineers. They didn't write any code.

## Build the Shared Language Before the Product

For the first six months, neither founder wrote a line of code. They interviewed engineers instead.

"When you don't have anything to sell, everybody is super happy to talk to you," Pomel said in a talk at SaaStr. Once a company has a product, every conversation turns into a pitch and people get guarded. Before that, they'll tell you exactly what hurts.

The fundraising forced the issue. Investors mostly said some version of "too early for us." West Coast firms didn't trust a New York infrastructure team, and the New York firms, Pomel told Forbes, "were not really specialized in the type of company we were building." So Lê-Quôc worked the DevOps community and early prospects while Pomel worked the investors. The rejection, Pomel said later, "grounded us in the customer problem."

Being in New York turned out to help with that. "We're a little bit closer to customers—there's more of them here," Pomel told Forbes years later. "And, you're out of the echo chamber in the Silicon Valley so here you can get ahead on what the customers think."

By September 2011 they had a pitch. Datadog was one of five finalists in the startup showcase at the Strata Summit, where Pomel described the mission in a line that sounds strange now: "We make understanding your operational data as easy as using Facebook or Twitter." His pitch described the "mess" developers and operations teams lived in, with every application bringing its own dashboard.

The company blog laid out three ideas behind it. Pull all of a company's operational data into one place, treating cloud and on-premise servers the same. Let teams share, discuss and act on it there. And "tag every single bit of data so that it maps to your language, your business, and your organization."

The homepage said "Graph, Share, Grok!" The beta came with a newsfeed of alerts, code commits and software builds, under a heading called "Social DNA."

Not all of it survived.

The social layer faded. Datadog retired its original event stream in 2022, and CoScreen, a screen-sharing app it bought that same year, reached end of life in July 2026.

The tags survived, and they turned out to be the most important idea in the pitch.

A tag is a label attached to every piece of data: which team owns it, which service it belongs to, which environment it runs in. When servers live for a few hours, tags are how the data stays meaningful after the machine that produced it is gone. They're also how a developer and an operations engineer end up looking at the same thing and calling it by the same name.

Shah, who co-led Datadog's Series A, wrote that Lê-Quôc taught him a lesson at an early board meeting: "a shared vocabulary can allow different people and different teams to communicate effectively."

**Before Datadog sold monitoring, it sold a shared vocabulary for what was happening in production.**

The early product taught them something else. A closed alpha with handpicked customers produced almost no useful signal, Pomel said; it was "way too open-ended, way too general." When they opened a public beta, the right users found them on their own. It was "a lot easier for users to self-select."

Pomel doesn't think the usual startup advice fits that kind of product. "I don't think there's an MVP for what we do. I think it's a myth," he said. Features had to pile up until there were enough of them for customers to start buying.

And the first buyers had a specific job. According to the founders' letter, the first real use case came from early users who were struggling to set up cloud infrastructure. In November 2011, the company blog announced "our newest customer": Sociocast, a startup running big-data workloads.

A year later, in November 2012, Index Ventures and RTP Ventures co-led a $6.2 million Series A. Infrastructure monitoring was generally available. The next question was how to get it onto as many servers as possible.

{{figure:positioning | What Datadog's homepage said, 2011 to 2026. Source: Internet Archive captures of datadoghq.com.}}

## Priced to Be Everywhere

The earliest version of Datadog's pricing page in the Internet Archive, from November 2012, fits on one screen.

Free for up to five servers. $15 per server per month after that. Integrations included, and each server counted once no matter how many integrations ran on it. Unlimited users. Monthly billing you could cancel at any time, with a 20% discount for paying a year up front.

The page even answered the obvious suspicion: "Yep our free tier is absolutely forever free - no catch!" Datadog promised it wouldn't ask for a credit card.

None of those mechanics was new on its own. New Relic, the leader in application performance monitoring, also charged per server and offered a free tier after a 14-day trial. The difference was the price. New Relic's Pro plan cost $149 per server per month on an annual contract in 2015, or $199 month to month, according to its archived pricing page.

So Datadog cost about a tenth as much per server. And it was meant to run on more of them.

Application monitoring went on the machines running the application. Datadog wanted to be on everything: databases, queues, web servers, build machines. The founders' letter names the two design choices plainly. Be deployed everywhere across a customer's cloud environment, and be used by everyone across development, operations and the business.

Unlimited users took care of the second part. A developer, an operations engineer and a product manager could all log into the same dashboards without anyone asking for another seat.

Integrations took care of the first. Instead of asking customers to replace what they had, Datadog pulled data out of it. Lê-Quôc described the approach as deliberately gentle: "Let us bring everything together in sort of one central repository where you can then look at everything in context." In 2018, he said, Datadog still coexisted "peacefully with a number of tools."

That mattered in the buying process. Replacing a monitoring tool is a project, with a budget, an owner and a risk someone has to sign off on. Adding one that connects to everything you already run is something an engineer can try on a Tuesday afternoon.

There's a human reason under the budget one. People feel worse about a loss they caused by acting than about the same loss from standing still. In a 1982 paper, Daniel Kahneman and Amos Tversky asked people about two investors who each missed out on $1,200, one because he switched stocks and one because he didn't. Ninety-two percent said the one who switched would regret it more.

Datadog never asked anyone to make the switch.

The homepage advertised "100+ turn-key integrations" by 2015. By the IPO there were more than 350. In October 2025, Datadog announced its 1,000th.

The pricing was also built for how the cloud actually behaved. When Datadog announced its Series B in 2014, it advertised hourly pricing for servers that didn't stay up all month. A customer spinning up 50 machines for an afternoon didn't have to pay for 50 machines for a month.

The anchor barely moved for years. By 2017 the page offered a Pro plan at $15 per server and an Enterprise plan at $23, billed annually. When APM arrived, it cost $31 per server, still about a fifth of what New Relic had charged in 2015.

There was one more constraint, and it was self-imposed. For a long time, Datadog only sold month-to-month. "We only sold month-to-month, meaning customers had the opportunity to churn all the time," Pomel said. The product had to earn its place every 30 days.

Now look at what all of that did to revenue.

Datadog's IPO filing says the company grows "with our customers as they expand their workloads in the public and private cloud." Because it billed per server, every server a customer added in the cloud added to Datadog's revenue, without a new sale.

The filing shows how strong that effect was. Datadog's dollar-based net retention rate was 141% at the end of 2017 and 151% at the end of 2018. In plain terms, for every $100 a group of customers paid Datadog in one year, they paid $151 the next.

That happened while very few of them had bought a second product. In mid-2018, only about 10% of Datadog's customers used more than one.

So most of that expansion came from customers using more of the first product, on more servers, as their clouds grew. Call it the first engine: the bill grows with the cloud.

**Most of Datadog's early growth from existing customers didn't need a second sale. It needed customers to keep adding servers.**

{{figure:price | 2015 list prices for the Pro plans on an annual contract. Sources: Internet Archive captures of both pricing pages.}}

## The Cloud Explains the Market, Not the Winner

If cloud adoption were the whole story, Datadog would have had a lot of company at the top.

Amazon Web Services grew from about $3.1 billion in revenue in 2013 to about $128.7 billion in 2025. Every monitoring startup founded around 2010 rode that wave.

Most of them sold early.

CopperEgg, an Austin company that monitored servers and websites, sold to Idera in 2013. Stackdriver, a Boston startup founded in 2012 by two former VMware engineers, built monitoring mainly for Amazon's cloud and sold to Google in May 2014. When TechCrunch covered its Series B in 2013, it had about 400 users, of which "dozens" paid. Librato, from San Francisco, sold to SolarWinds for $40 million in January 2015. By 451 Research's count, SolarWinds expected it to add $2 million to $3 million in revenue. Boundary went to BMC the same year.

In January 2015, Datadog had about 1,000 customers, 75 employees and $53.4 million in venture funding, according to TechCrunch.

Two things separated it from the rest of the cohort.

The first was breadth. In 2013, Datadog added support for Microsoft Azure, HP Cloud, Red Hat OpenShift and OpenStack alongside Amazon. Stackdriver sold monitoring for AWS. Datadog sold monitoring for wherever your infrastructure happened to run, including your own data center.

That mattered more every year. Each cloud ended up with its own monitoring: Amazon had CloudWatch, Google turned Stackdriver into its own product, and Microsoft built Azure Monitor. A tool that watched all of them at once, plus everything running on top of them, had a reason to exist that no single cloud's tool could match.

The second was the decision to keep going. Datadog raised a $15 million Series B led by OpenView in February 2014, a $31 million Series C led by Index in January 2015, and a $94.5 million Series D led by ICONIQ Capital in January 2016. By then it had 180 employees, and Pomel told TechCrunch revenue had tripled in each of the previous four years.

The customer list in that 2016 story is its own argument. It named Salesforce, Google, Zendesk, Airbnb and Samsung. It also named HP, which sold monitoring tools of its own. When a monitoring vendor pays for your monitoring, the product is doing something its own tools aren't.

About 90% of the business was still in the United States. Most of the engineers were in New York, with a research office in Paris. The plan was to expand into Europe, Asia and South America, which meant the company West Coast investors wouldn't back in 2010 was now funding a global build-out.

The growth after that makes the point. From 2017 to 2025, AWS revenue grew about 7 times. Datadog's grew about 34 times, from $100.8 million to $3.43 billion.

Pomel is candid that timing helped. "A lot of it was luck," he told TechCrunch in 2018.

But the same luck was available to everyone in that cohort.

**The cloud explains why the market existed. It doesn't explain who won it.**

{{figure:cohort | Same wave, different exits: cloud monitoring startups of the early 2010s and how they ended. Sources: TechCrunch, Data Center Knowledge, 451 Research, Bloomberg, Datadog's S-1.}}

## Sell the Next Product Where They Already Look

In January 2016, Pomel explained to TechCrunch what Datadog wasn't.

It wasn't simply application performance monitoring, he said. Datadog sat in the middle of a company's monitoring setup and pulled data from tools like New Relic and AppDynamics, and from log tools like Splunk, into one dashboard.

Eight months later, Datadog announced its own APM. It became generally available in February 2017, a few weeks after Cisco agreed to pay $3.7 billion for AppDynamics.

Whether the 2016 positioning was a conviction or a waiting room, the launch announcement made the reasoning clear. The old split between application monitoring for developers and infrastructure monitoring for operations, it said, "no longer makes sense," because "you can't fully understand their intertwined behavior by observing them separately."

That's the founding idea applied a second time. In 2010, the divide was between two teams. By 2017, it was between two categories of tools, and Datadog already had one of them running on every server.

It could also see what customers wanted next. "From the very early days, we saw our customers integrate additional data sources into their Datadog accounts," the founders wrote in 2019, "and build their own tooling on top of our platform."

**A product that collects everything doubles as a sensor. It shows you what customers are trying to do before you've built it for them.**

Seeing the next product was easier than building it. For APM, Datadog pulled productive engineers off the core product and gave them about a month to hand off their work. "That was painful," Lê-Quôc said. For logs, it bought Logmatic.io, a small Paris company, in September 2017, choosing it as much for the team's chemistry and size as for the technology. Log management became generally available in March 2018.

Then Datadog went after the thing customers hated most about logs, which was paying to store everything. Logging without Limits, launched in July 2018, let customers send all their logs but pay mainly for the ones they chose to index.

It announced that at the first DASH, its own user conference, held in New York that month. The founders' letter later claimed Datadog was "the first to combine the 'three pillars of observability'" with that log product: metrics, traces and logs, in one place, on one data model. Each pillar used to be a separate category with separate vendors. Datadog was now selling all three to the same team.

The second engine started almost immediately.

In mid-2018, about 10% of Datadog's customers used more than one product. A year later it was about 40%. In the first half of 2019, about 60% of new customers started with more than one product, and more than 35% of new annual recurring revenue came from APM and logs, according to the IPO filing.

By the end of 2020, 72% of customers used two or more products. By the end of 2025, 84% did, 55% used four or more, and 9% used ten or more. Infrastructure monitoring had passed $1.6 billion in annual recurring revenue, log management $1 billion, and APM together with digital experience monitoring another $1 billion.

None of those products needed a new installation. The agent was already on the servers, the data was already tagged, and the engineers were already looking at the dashboards.

**The best place to sell the next product is the screen your customer already has open.**

{{figure:engines | The two engines. Top: Datadog's net revenue retention, as reported (exact figures through mid-2019, ranges after). Bottom: share of customers using two or more products. Sources: Datadog's S-1, annual reports and earnings calls.}}

## Sales Harvests What the Product Plants

Datadog didn't start with salespeople.

In the early years, the head of product also ran sales, by design, Pomel said in a 2023 conversation hosted by RTP Global. Product people talked to customers, tested pricing and iterated. The first salesperson came only after the company had some recurring revenue.

Support was part of the sales motion before there was a sales motion. Lê-Quôc did customer support himself in the early days, and engineers still rotate through it. In 2018 he explained why: if someone on a free trial contacts support, even to complain, "it means they care." That makes a support ticket one of the strongest buying signals a trial user can send, so Datadog staffed it with engineers who could solve the problem on the spot instead of with the cheapest agents it could find.

For anyone running a trial funnel, that's a different way to read the queue. The users who write in are the ones most likely to buy.

Marketing started narrow, too. Alex Rosemblat, Datadog's first marketing hire and later its CMO, told a SaaStr audience in 2025, according to SaaStr's write-up of the talk, that the company's first channel was sponsored trade shows in the AWS ecosystem, and that the team spent about 18 months on that one channel before adding another. By his account, Datadog became one of the largest sponsors at AWS re:Invent, which brought in its biggest customers and the best return of anything it tried. Press and analyst relations, he said, did little for the bottom line.

The enterprise sales team came in 2016. By then, Datadog's recurring revenue was around $50 million to $60 million, according to board biographies of Dan Fougere, the chief revenue officer who built that team and took the business to about $1 billion.

Datadog didn't hunt for the enterprise so much as let it arrive. Shah wrote that the company chose not to push upmarket on its own. As large companies moved to cloud architectures, they came to Datadog.

By the IPO, the company described three motions: a self-service tier, a fast-moving inside sales team, and an enterprise sales force. About 60% of its revenue growth came from existing customers.

The case studies in the filing show what that looked like. Zendesk started with infrastructure monitoring in 2013, added APM in 2018 and log management in 2019, and had more than 500 engineers using Datadog. Coinbase chose Datadog in 2018, after a 60-fold surge in traffic overwhelmed the monitoring tool it had built itself.

In that model, the salesperson usually arrived after the product did.

You can see it in where Datadog spends its money. In 2021, it spent 29% of revenue on sales and marketing and 41% on research and development, according to its annual report. The median public software company at the time spent 44% of revenue on sales and marketing and 25% on R&D, according to Jamin Ball's Clouded Judgement newsletter. Datadog has kept roughly that mix since. In 2025 it spent 28% on sales and marketing and 45% on R&D, a figure that includes about $470 million of stock-based pay.

{{figure:spend | Where the money goes: sales and marketing vs. R&D as a share of revenue. Datadog in 2021 vs. the median public software company in January 2021. Sources: Datadog's 2021 annual report; Clouded Judgement.}}

**Datadog used the product to create demand and sales to harvest it, the reverse of how most software companies spend.**

The discipline went back to the beginning. Datadog raised about $148 million before its IPO, but only $92 million net of share repurchases, according to its filing, and its operations produced cash in both 2017 and 2018. Pomel told Forbes that relying on small checks and angel investors early on forced the company to build an efficient business. In 2025, it generated $915 million in free cash flow.

That's the context for the Cisco offer. Datadog didn't need to sell, and it believed the machine was worth more running than sold.

Investors agreed on the first day. "One thing investors reacted to was the fact that we run a healthy business from a profitability perspective," Pomel told Forbes after the close. Datadog had lost $10.8 million in 2018 on nearly $200 million in revenue, a fraction of what comparable cloud IPOs were losing. And his verdict on the 39% first-day pop was characteristically understated: "The stock, it's up a good amount, but not too much. I think that's what we were looking for."

Its closest rival took a different road. New Relic, which went public in 2014, overhauled its pricing in 2019 and 2020, moving from per-server pricing toward data volume and paid user seats, while its leadership turned over. In 2023, Francisco Partners and TPG took it private for about $6.5 billion. Its CEO later said the pricing transition had absorbed a great deal of management's energy.

{{figure:machine | The Datadog machine: two engines, and the limits built into them.}}

## The Meter Runs Both Ways

As Datadog added products, it added meters.

By 2020, its pricing page charged per server for infrastructure monitoring and APM, per gigabyte of logs ingested, per million log events indexed, per 10,000 synthetic test runs and per 10,000 user sessions. On top of that sat custom metrics, which Datadog counts by each unique combination of a metric name and its tag values.

That last one carries an irony. Tags, the shared vocabulary from the 2011 pitch, also multiply the bill. Add a tag with thousands of possible values, like a user ID, and one metric can turn into thousands of billable ones.

Developers noticed. When Datadog's IPO filing hit Hacker News in 2019, one of the top comments read: "Love their product, hate their shady billing."

For years, the meter mostly ran up. In 2022, it started running down.

As companies cut costs, Datadog's largest customers went to work on their cloud bills. Because Datadog's revenue tracked their infrastructure, it fell with them, without those customers leaving. Its net retention rate, above 130% through 2022, dropped to just under 120% by September 2023 and to the mid-110s by the end of that year. Revenue growth slowed from 63% in 2022 to 27% in 2023. Headcount grew only 8% that year, by far its slowest since going public, and the stock lost about two-thirds of its value between its November 2021 peak and April 2023.

The most famous example came on an earnings call in May 2023. Datadog's billings growth had been dragged down by what it called "a large upfront bill that did not recur," from a crypto customer that had moved early on cost optimization. A JPMorgan analyst estimated the bill at about $65 million, and Gergely Orosz of The Pragmatic Engineer later reported that the customer was Coinbase.

There was a second front: openness. The industry was rallying around OpenTelemetry, an open standard for collecting the same kind of data Datadog's agent collected. In January 2023, a widely shared Hacker News thread accused Datadog of stalling an OpenTelemetry change that would make it easier to move trace data out of Datadog's libraries. A Datadog engineer who helped maintain the project said he'd stepped back from reviewing it to avoid a conflict of interest, and the work moved forward. But the thread put the lock-in debate in public. "Open-source Datadog alternative" became a genre of startup launch on Hacker News, from SigNoz to HyperDX to ClickHouse's ClickStack.

Datadog's answer was to make the meter more flexible rather than remove it. Logging without Limits had already separated paying to ingest logs from paying to index them. Flex Logs, a cheaper tier for logs kept longer, was approaching $100 million in annual recurring revenue by the end of 2025, management said. In 2026 Datadog added the option to keep logs inside a customer's own cloud and query them there, and to search data stored in Databricks and ClickHouse without moving it.

Retention recovered. Net revenue retention climbed back to about 120% in 2025 and the low 120s by mid-2026, and gross revenue retention stayed in the mid-to-high 90s throughout. Customers cut usage. Very few left.

**The pricing that made expansion automatic made contraction automatic too.**

## When Someone Else Owns the Budget

If Datadog's machine works because the product is already in front of the buyer, the real test is what happens when it isn't.

Security is that test.

Datadog made its Security Monitoring product generally available in April 2020. It added cloud security posture management and workload security, and in 2021 it bought Sqreen, a French application security startup. The logic was the same as with APM and logs: the agent was already on every server, and the logs security teams need were already flowing into Datadog.

The results have been good and much slower. Datadog's security products passed $100 million in annual recurring revenue in 2025, according to an analyst note and the company's 2026 investor day. On the third-quarter 2025 call, Pomel said security ARR growth was "in the mid-50s" percent. Log management, which launched two years earlier, had passed $1 billion. Even at that growth rate, security is a small slice of a company with more than $3.5 billion in annual revenue.

The difference is the buyer. Observability gets sold to the engineers who already live in Datadog. Security gets sold to a chief information security officer and a security team with their own tools, their own vendors and their own criteria. Datadog's job listings describe security specialists who co-sell alongside its enterprise reps to "CISOs and security leadership."

**Same data, same agent, different budget. That's where the engine slows.**

Datadog has been working on both sides of that boundary. It rebuilt Cloud SIEM in late 2024 and pitched it as something a company could run without a dedicated security staff, which is another way of saying it can be sold to the engineering team that's already there. In 2026, it made its AI security analyst work on data from other vendors' SIEMs, so it can get into a security team's workflow before that team switches anything. And it reached FedRAMP High in May 2026, which opens up government security buyers that require it.

The early numbers say it's working, on a slower clock. Pomel credited the acceleration to investment in channel partners, a more mature product and the company's growing experience selling security, which is a polite way of saying it had to learn a sale it didn't already know.

The boundary runs the other way, too. The biggest security vendors have spent the last few years buying their way into observability. Cisco closed its $28 billion acquisition of Splunk in March 2024. Palo Alto Networks agreed to buy Chronosphere, a fast-growing observability startup, for $3.35 billion in November 2025.

In August 2026, The Information reported that Palo Alto's CEO, Nikesh Arora, had pursued Datadog itself over roughly 18 months before buying CyberArk and Chronosphere instead. For the second time, Datadog stayed independent.

So both sides are betting the same data ends up in one place. They disagree about who buys it.

Datadog's best opening is where the two meet, which is logs. Management said that in 2025 it closed nearly 100 deals that replaced a large legacy log vendor, and Pomel said Cloud SIEM was starting to show up in larger deals. The security sale is easiest when it starts as a logs sale.

## Complexity Is the Product

At its investor day in February 2026, Datadog framed its business as a race against complexity.

It's a good summary of the whole history. Every shift that made software harder to understand made Datadog's market bigger. Virtual machines multiplied servers. Containers made them shorter-lived. Serverless functions made some of them disappear. Microservices turned one application into hundreds of pieces. Each shift came with a Datadog product: container monitoring in 2014, serverless monitoring in 2016, distributed tracing with APM in 2017.

AI is the biggest version yet.

By the time it arrived, Datadog was a different kind of company. It joined the S&P 500 in July 2025, with $2.8 billion in revenue over the previous 12 months. At the 2026 investor day, it said its roughly 32,000 customers were still only about 7% of the 500,000 companies it considered its market.

In the second quarter of 2026, Datadog's revenue grew 36% to $1.12 billion, its fastest growth since 2022. In February it had forecast full-year revenue of $4.06 billion to $4.10 billion. By August, the forecast was $4.45 billion to $4.47 billion.

A lot of that came from AI companies. AI-native customers made up 12% of revenue in the third quarter of 2025, up from about 6% a year earlier. By mid-2026, Datadog said more than 750 AI companies used it, including all ten of the top ten AI leaders, with 31 spending more than $1 million a year and eight more than $10 million. Growth from everyone else accelerated too, into the high 20s.

The meter showed up again. Datadog's largest customer, which analysts widely believe is OpenAI, renewed a nine-figure contract covering 17 Datadog products and then started using less of it. Stifel estimated that OpenAI spent about $300 million with Datadog in 2025. Datadog built the reduction into its guidance.

Datadog is also using AI on itself. Its Bits AI agent investigates incidents on its own, and management said more than 2,000 trial and paying customers ran investigations with it in a single month in late 2025. At its DASH conference in 2026, Datadog showed versions that go from detecting a problem to fixing it. It also trains its own time-series model, Toto, which it released with open weights.

That raises the question the whole machine depends on. Datadog's strategy is to be the screen everyone looks at first. What happens when AI agents do the looking?

Pomel's answer, on the February 2026 earnings call, was that Datadog's advantage is real-time analysis built into the data stream itself. General-purpose AI models, he said, are "not quite there yet." He also said customers who build their own observability tools remain "a small minority of the cases."

Both can be true today. The risk is that the screen matters less once software reads the data first. The opportunity is that the company that already holds the data, the integrations and the engineers' trust is the best placed to build the software that does the reading.

**Every wave that made software harder to understand made Datadog's market bigger. AI is the first one that might do some of the understanding itself.**

## What Transfers

Strip away the products and the numbers, and Datadog's machine comes down to one rule.

**The company customers look at first gets to sell them what they find.**

Datadog earned that position in a specific order, and most of it applies well outside monitoring.

**Land where the work already happens.** Datadog's first sale didn't ask anyone to replace anything. It connected to the tools customers already had and became the one place where all of them could be seen together. An additive first sale skips the budget fight that a replacement starts.

**Price for footprint when usage tracks value.** $15 a server, no seat fees and free integrations put Datadog on every machine and in front of every team. Usage-based pricing grows with the customer without a new deal. Just plan for the year it shrinks.

**Let the product create the next deal.** Datadog spends more on R&D than on sales and marketing because each new product sells into an installed base that already trusts it. By the time a salesperson shows up, the product has usually done the first part of the job.

**Read the trial like a pipeline.** Datadog treated a support ticket from a trial user as a buying signal and answered it with an engineer. The users who reach out are telling you they care, and that moment is worth more than any nurture sequence.

**Watch the buyer boundary.** Expansion is fastest inside one budget. Crossing to a new buyer, like Datadog's move into security, is a new sale even when the product and the data are the same.

Some of it doesn't transfer. Datadog started at the moment infrastructure moved to the cloud. Its founders were engineers who had lived the problem for years, and they've now run the company together for 16 years while their closest rival went through repeated leadership changes. It had the patience to turn down Cisco. And Pomel himself credits luck.

The machine also has limits built in. The meter runs both ways when customers optimize. The engine slows when someone else owns the budget. And AI might change who looks at the screen.

For 16 years, though, Datadog has followed the same idea it pitched at a startup showcase in 2011: pull everything into one place, label it in the customer's own language, and let every team see the same truth.

Everything else it sells is what customers found when they looked.
