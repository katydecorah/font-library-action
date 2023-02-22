# font-library-action

Update the library when a new font is added.

<!-- START GENERATED DOCUMENTATION -->

## Set up the workflow

To use this action, create a new workflow in `.github/workflows` and modify it as needed:

```yml
name: Update library

on:
  schedule:
    - cron: "30 5 * * *"
  workflow_dispatch: # enables run button on github.com

jobs:
  update_library:
    runs-on: macOS-latest
    name: Update library
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      - name: Update library
        uses: katydecorah/font-library-action@v3.0.0
        with:
          GoogleToken: ${{ secrets.GoogleToken }}
      - name: Commit files
        if: env.UpdatedLibrary == 'true'
        run: |
          git pull
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add -A && git commit -m "${{ env.LibraryCommitMessage }}"
          git push
```

## Action options

- `GoogleToken`: Your Google Fonts access token.
<!-- END GENERATED DOCUMENTATION -->
