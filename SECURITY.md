# Security policy

## Supported versions

The live site at https://knowyourballot-ng.vercel.app and the `main` branch are supported. Older commits and preview deployments are not.

## Reporting a vulnerability

Please do not open a public issue for a security problem.

Use GitHub's private vulnerability reporting: open the repository's **Security** tab and choose **Report a vulnerability**. If that is unavailable, open a minimal public issue asking the maintainer to enable a private channel, without disclosing the details.

Include:

- what the problem is and why it matters;
- the affected URL, commit or file;
- steps to reproduce, with the smallest example you can;
- any evidence that helps confirm the issue.

Do not include real personal data, secrets or access tokens in a report.

The maintainer aims to acknowledge a report within 7 days and to agree a fix and disclosure timeline with you. These are targets, not guarantees.

## Scope

In scope:

- the application code in `src/`;
- the API routes, especially `/api/search-miss`;
- the Python data pipeline in `scripts/` and the GitHub Actions workflows;
- dependencies and build configuration;
- deployment and response headers.

Out of scope:

- corrections to candidate facts: use the correction issue template instead;
- denial of service caused only by very high request volume;
- social engineering;
- vulnerabilities in GitHub, Vercel, INEC or other third-party services, which should be reported to those providers;
- preview deployments being publicly reachable, when no data or credentials are exposed.

## Safe harbour

Good-faith research is welcome. Please:

- avoid accessing, changing or deleting data that is not yours;
- avoid testing against real users or real personal data;
- avoid high-volume or destructive testing;
- give the maintainer reasonable time to fix the issue before public disclosure.

The project will not pursue legal action for good-faith research that follows these rules.

## Recognition

Contributors who report a valid issue can be credited in the fix, or can remain anonymous.
