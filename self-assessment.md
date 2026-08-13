# Professional Self-Assessment

[← Back to home](README.md)

Over the past several years in Southern New Hampshire University's Computer Science program, with a concentration in software engineering, I have built a foundation that goes well beyond writing code that works. Completing this capstone, and specifically the process of returning to a project I built in an earlier course and enhancing it under real scrutiny, has clarified what I actually value in this field: correctness that is demonstrated, not assumed, and communication that makes technical decisions legible to whoever is reading them, whether that is an instructor, a teammate, or a future employer. This ePortfolio, and the enhancements documented in it, are the clearest evidence I can offer of both.

## Collaborating in a Team Environment

My most concentrated experience with collaborative software practice came through the code review process itself. Courses like CS 250, Software Development Lifecycle, introduced formal software process and the role reviews play within it, but this capstone is where that idea became a lived habit rather than a concept in a textbook. Every enhancement in this ePortfolio went through a submit-review-revise cycle with my instructor, the same structure a professional team uses when a pull request goes out for review. That process directly shaped how I write code now. I document my reasoning in comments aimed at a future reader, not just myself, and I have learned firsthand that a checklist-based review catches categories of defects, like the authentication bypass I found in my own JWT middleware, that a solo read-through or a simple "does it run" test never would.

## Communicating with Stakeholders

Communicating clearly with a non-present audience was a constant thread across this program, from the code review video, to the written narratives accompanying each enhancement, to something as small as writing a commit message that explains why a change was made, not just what changed. I learned to adapt that communication to its audience. A code review video aimed at someone who may not read every line of code needs a different level of detail than a narrative written for an instructor evaluating a specific rubric criterion, and both are different again from in-code comments meant for whoever maintains a project next.

## Data Structures and Algorithms

My coursework in Discrete Mathematics, Applied Linear Algebra, and Data Structures and Algorithms: Analysis and Design gave me the theoretical foundation, but the Algorithms and Data Structures enhancement in this ePortfolio is where that foundation became a real design decision rather than a homework requirement. Faced with a trip listing that had no search or sort capability, I chose a Map keyed by resort name specifically because it gave O(1) average-case lookups for the most common filter operation, rather than defaulting to the array-scanning approach that would have been the path of least resistance. Documenting that choice, and the O(n log n) sort built alongside it, with a real test suite rather than a visual inspection, reflects how I now approach algorithmic decisions: pick the structure that matches the access pattern, and prove it behaves the way you claim.

## Software Engineering and Database

Courses across the program, from IT 145 and CS 250 early on to CS 465, Full Stack Development, where the artifact in this ePortfolio originated, built my ability to reason about a system as a whole rather than a single function in isolation. The Software Design and Engineering enhancement in this portfolio corrected a real defect in that original system's authentication flow, and the Databases enhancement went further, adding role-based access control and bringing password hashing in line with current OWASP guidance, while specifically designing the change so it would not silently lock out users who existed before the update. That kind of forward-thinking database design, not just what a schema looks like today but how it behaves as data and requirements change, is exactly the engineering judgment I want to keep building in my career.

## Security

Security is the thread that runs most consistently through this entire capstone, and it is also the area where my thinking changed the most concretely. Coursework like CS 405, Secure Coding, introduced the vocabulary and the standards, but this capstone is where I found and fixed a real, exploitable authentication bypass in code I had written myself, and later designed a password-hashing migration specifically so that strengthening security would not break the system for existing users in the process. I now treat security less as a checklist applied at the end of a project and more as a set of questions worth asking at every design decision: what happens if this input is malicious, what happens if this fails, and who is allowed to do what.

## How This ePortfolio Fits Together

Rather than presenting three disconnected exercises, this ePortfolio uses a single artifact, Travlr Getaways, a full stack travel booking application originally built in CS 465, to demonstrate growth across all three required categories. The Software Design and Engineering enhancement addresses the application's backend and authentication layer, the Algorithms and Data Structures enhancement addresses its Angular front end, and the Databases enhancement addresses its MongoDB data layer and access control model. Presenting one cohesive system, enhanced from three different angles, was a deliberate choice: it reflects how software engineering actually works in practice, where the same codebase has to be secure, efficient, and well-modeled all at once, not three separate skills exercised in isolation. The code review, artifacts, and narratives on the rest of this site walk through each of these enhancements in detail, including the original code, what was found during review, what was changed, and how each change was verified.

---

[← Back to home](README.md)
