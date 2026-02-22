# Issue #250423: MCP resource templates need better UI

**Repository:** microsoft/vscode
**Author:** @jrieken
**Created:** 2025-06-03T09:50:19Z
**Labels:** feature-request, chat-mcp

## Description

Testing #250353

* use GH MCP server
* select "repo context for PR"
* the template-filling is v e r y rough and something I would never use during my day to day activities 

cc @isidorn and @hawkticehurst for ideas/brainstorming 

This is the flow for accessing https://github.com/microsoft/vscode/pull/243255/files#diff-87f74a0d7860691860459028f51b1ec606bce090b37a2d381dcfc51a86a5f760

https://github.com/user-attachments/assets/0bc02ad2-aa7d-4c61-a0ad-315632197dbc

## Comments


### @jrieken (2025-06-03T09:55:17Z)

@connor4312 what is the flow here? Do you refresh/resolve the resource after each placeholder is being filled in or only after all of them have values?

What do others do? Could we use snippets? The QP input part is a monaco editor and we could use its flow like so

https://github.com/user-attachments/assets/ad13c0ed-706e-4c50-8783-cb1c3ff80565

---

### @isidorn (2025-06-03T13:37:59Z)

Agreed that QuickPick makes this impossible to use.
Stable editor would make it easier. 

Any way we autofill (guess) based on currently open workspace?

---

### @connor4312 (2025-06-03T18:56:32Z)

This gets better with completions (e.g. for GH in https://github.com/github/github-mcp-server/pull/451) but I agree it's not necessarily optimal.

> what is the flow here? Do you refresh/resolve the resource after each placeholder is being filled in or only after all of them have values?

We get a URI template string (all [specced out](https://datatracker.ietf.org/doc/html/rfc6570)) which contains expressions that each contain one or more variables. We then parse that string, and ask the user for each variable in order. We ask the MCP server for completions for each variable, including previously-resolved variables (with experimental support of https://github.com/modelcontextprotocol/modelcontextprotocol/pull/598) and show those to the user. We could probably figure out a way to do this flow in an editor as well, at least for simple template URI (I don't imagine we'll ever get super complex ones)

---

### @jrieken (2025-06-04T07:22:13Z)

> We ask the MCP server for completions for each variable, including previously-resolved variables (with experimental support of https://github.com/modelcontextprotocol/modelcontextprotocol/pull/598) and show those to the use

Thanks for clarifying. We should maybe look into making this use a normal completions provider then

---
