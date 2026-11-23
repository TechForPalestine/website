---
title: "How to ensure quality apps"
description: "Many project leaders have struggled with bugs, and other quality control issues in your product."
order: 4
---

Many project leaders have struggled with bugs, and other quality control issues in your product. Quality control is super important: users (correctly) associate a buggy product with a low quality product, and it will make it less likely that they will get value from it, continue to use it, or refer users.

In addition, bugginess slows down building a product. Finding a bug while you're building something will allow you to fix it quickly. If instead you only find bugs because users report them, the overhead of fixing it–the user report, following up for more information, trying to debug it, waiting for the next release–can increase the cost of bugs by 20x.

However, the counter side is that meticulous testing slows down product development. If you have to manually go through the entire app each release to ensure it still works, it can take a lot of time.

Automated testing is clearly a solution, but even automated testing can be a problem. Adding tons of unit tests, or having a collection of slow and flaky integration tests, can really add a big burden to development, one that developers feel doesn't always pay off.

The main things to handle are:

- how to prioritize fixing bugs
- keeping bugs from recurring
- making it cheap to fix bugs
- lowering the risk from changes

Here's our tips for quality control on your app.

## Testing

The major kinds of tests are "unit tests", "functional tests", and "integration tests". Unit tests test small bits of functionality (often just a function). Functional tests are used to verify parts of your app, such as API endpoints, or app components. Integration tests replicate the user's journey to ensure that it works, and is usually done by having a bot click through your app in a real browser.

A good split of tests is lots of unit tests, (which are typically very fast), a decent chunk of functional tests, and a handful of integration tests (which can be slow and flaky).

The first place to start is to have a test framework integrated with your app. GenAI is generally pretty good at getting these into place. At the start, add just one test - it can do anything, it doesn't matter. Then, whenever someone comes across a bug, add a test to ensure the bug is gone.  
This is very very important, and is the absolute best strategy for having a non-buggy application. If you add a test each time you find a bug, you will rapidly develop a test suite that can keep your app from regressing and reintroducing the same bugs you've had before. It is also likely that the coverage will find other bugs that you introduce.

Add the test at the cheapest place possible.

- If the bug is in the functionality of a specific algorithm or chunk of code, add a unit test for it. If the broken code is just part of a much larger function, you might consider refactoring the function (pulling out the code into its own function) so you can test just the core functionality that broke. Having small functions makes it easier to test code.
- If the broken functionality is in glue code, like API controllers, testing the functionality directly is a good choice. A functional test can be used to check that, for example, a specific JSON field exists in the HTTP response of an API call. You can write tests that check that the output of some response matches the expected output by having expected inputs and outputs in your codebase. If the output changes intentionally, you simply look at the diff with the expected output to ensure it has changed in the right way, and then update the expected output in the test suite.
- If the problem was in UI functionality, or something related to the browser or mobile framework, you may have to create an integration test for it. Note that integration tests are slow and frequently become flaky - if you are adding a lot of integration tests you should consider that a red flag; can you test the same functionality with just one integration test and a handful of unit tests?
- It is very helpful to have a small handful of integration tests which test important flows in the application, such as the login flow, payments, onboarding, or important functionality. That way, if something important breaks, it will often catch it. However, when these tests find errors, it is often useful to add new unit or functional tests to address it, not least because that will be faster to repeatedly run the tests as you're checking whether the fix works.

Many developers like "test driven development" - this is where you write the tests first and then develop the functionality. I do often like to write tests before I fix bugs but otherwise I tend not to do TDD - however, many people like it so you might consider it.
