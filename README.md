# font-library-action

Update the library when a new font is added.

<!-- START GENERATED DOCUMENTATION -->

## Set up the workflow

To use this action, create a new workflow in `.github/workflows` and modify it as needed:

```yml
name: Update library

on:
  issues:
    types: opened

jobs:
  update_library:
    runs-on: macOS-latest
    name: Update library
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      - name: Update library
        uses: katydecorah/font-library-action@v2.1.0
        with:
          GoogleToken: ${{ secrets.GoogleToken }}
      - name: Commit files
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add -A && git commit -m "Updated font library"
          git push
```

## Action options

- `GoogleToken`: Your Google Fonts access token.

<!-- END GENERATED DOCUMENTATION -->
