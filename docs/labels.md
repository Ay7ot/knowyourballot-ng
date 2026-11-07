# Labels

The issue templates and the prefilled correction, photo and manifesto links use these labels. Create them once in the repository settings, or with the GitHub CLI from the repository root:

```sh
gh label create correction --color d73a4a --description "A wrong or missing fact, with a source"
gh label create photo --color a2eeef --description "A candidate photo, credit or removal request"
gh label create manifesto --color 0075ca --description "A manifesto, pledge or policy source"
gh label create data --color e4e669 --description "Data pipeline, coverage or parsing"
```

Check the current labels with:

```sh
gh label list
```

The templates still work if a label is missing. The label is simply not applied.
