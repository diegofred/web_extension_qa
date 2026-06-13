# Test Case

## Title

Prospect Matching - Successful Match

---

## User Story

As a leasing agent,

when I open a prospect detail page,

I want the extension to automatically detect the prospect,

so that it can locate a matching screening.

---

## PMS Fixture

generic/prospect-detail.html

---

## Mocked APIs

GET /api/prospect-match

---

## Preconditions

User authenticated

Extension loaded

Sidepanel opened

---

## Steps

1. Open prospect detail page
2. Open sidepanel
3. Trigger prospect detection
4. Wait for matching response

---

## Expected Results

* Prospect information is extracted
* Matching API is called
* One prospect is returned
* Prospect is displayed
* Sidepanel navigates to prospect details

---

## Assertions

* Prospect name visible
* Prospect email visible
* Sidepanel URL updated
* No console errors
