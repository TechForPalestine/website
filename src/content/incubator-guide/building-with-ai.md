---
title: Building with AI, and keeping quality up
description: Why every project should use AI coding tools, and a light approach to testing that keeps bugs from coming back.
order: 3
---

## Build with AI tools

The best AI coding tools can now build substantial, complex apps without a dedicated engineering team. It's still easier with a technical background, so keep your engineers if you have them. But people without one can now make real progress building apps, and for many projects this is the right approach.

Look at tools such as [Claude Code](https://www.anthropic.com/claude-code) and [Replit](https://replit.com/) (whose founders are Palestinian). With both, you can describe what you want the app to do, and the AI makes a plan and builds features with you step by step. For simple websites, [Lovable](https://lovable.dev/) is another option.

You and your developers should all be using these tools. They are too powerful to ignore, especially when volunteers have limited time. A feature that would take 20 volunteer hours spread over two months can often be done in 20 minutes.

Several project leaders who aren't engineers have built sites and apps this way, without an engineering team. That can work better than working with engineers: there's far less communication, no misunderstanding about how things work, and no waiting for feedback.

If your project later needs specialist skills, such as hosting or cloud infrastructure, we may be able to find you a volunteer or lend you a staff engineer. Some tools cost money, and our small grants can help cover them.

Further reading: [Claude Code best practices](https://www.anthropic.com/engineering/claude-code-best-practices).

## Keep quality up

Bugs hurt projects. Users rightly see a buggy product as a low-quality one, and they're less likely to get value from it, keep using it or recommend it.

Bugs also slow you down. A bug you find while building is quick to fix. A bug a user reports costs far more: the report, following up for details, debugging, waiting for the next release. That can make it 20 times as expensive.

But careful testing slows development too. Clicking through the whole app before every release takes a lot of time. Automated tests help, but piles of unit tests or slow, flaky end-to-end tests can become a burden that doesn't feel worth it.

What you need to handle is:

- deciding which bugs to fix first;
- stopping bugs from coming back;
- making bugs cheap to fix; and
- lowering the risk of each change.

### Add a test for every bug

There are three main kinds of test:

- **Unit tests** check small pieces of code, often a single function. They are fast.
- **Functional tests** check parts of your app, such as an API endpoint or a component.
- **End-to-end (integration) tests** follow a user's journey, usually by having a bot click through your app in a real browser. They are slow and can be flaky.

A good mix is lots of unit tests, a fair number of functional tests and a handful of end-to-end tests.

Start by adding a test framework to your app. AI tools are good at setting one up. Add a single test; it doesn't matter what it checks. Then, every time someone finds a bug, add a test that proves the bug is gone.

This is the single best way to keep an app from getting buggy. Each bug you fix adds a test, so you quickly build a test suite that stops old bugs coming back, and often catches new ones too.

### Test at the cheapest level

- **A bug in a specific piece of logic:** add a unit test. If the broken code is buried in a large function, consider pulling it out into its own small function so you can test just that part.
- **A bug in glue code, such as an API endpoint:** test the endpoint directly, for example by checking that a field exists in the response. You can keep expected inputs and outputs in your codebase and compare against them. When the output changes on purpose, check the difference and update the expected output.
- **A bug in the interface, or in the browser or mobile framework:** you may need an end-to-end test. If you're adding many of these, treat it as a warning sign. Could one end-to-end test and a few unit tests cover the same thing?

Keep a few end-to-end tests for your most important flows, such as sign-up, login, payments and core features, so you know quickly when something important breaks. When one fails, it's often worth adding unit or functional tests for the cause, which also run faster while you work on the fix.

Some developers like test-driven development, writing tests before the code. It's worth trying, especially before fixing a bug, but it isn't required.
