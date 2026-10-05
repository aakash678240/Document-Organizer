# Document Organizer

A colourful, browser-based app for uploading, searching, sorting and previewing your documents. It runs entirely in the browser with plain HTML, CSS and JavaScript. There is no build step, no framework and no backend.

## Features

- **Drag-and-drop upload.** Drop files onto the upload area or click to browse. Multiple files are supported.
- **Search and filter.** Search by file name and filter by category: Text, PDF, Images, Office or Other.
- **Sorting.** Sort by:
  - **All** (the order files were added)
  - **Size**
  - **Upload time**
  - **Modified date**
  - **Name**

  A button flips between ascending and descending order.
- **Rich preview panel:**
  - Text files show their content with word and line counts, and a Copy text button.
  - Images are displayed inline.
  - PDFs open in an embedded viewer.
  - Other file types offer a download.
- **Dark mode.** A moon/sun toggle in the top right corner. Your choice is saved, and on the first visit the app follows your system theme.
- **Library stats.** See the number of documents, total size and how many match your current filters.
- **Persistent storage.** Documents are saved in your browser's `localStorage` and are still there when you reload the page.
- **Responsive and accessible.** Works on phones, supports keyboard navigation, and respects reduced-motion settings.

## Getting started

1. Clone the repository:

   ```bash
   git clone https://github.com/<your-username>/document-organizer.git
   cd document-organizer
   ```

2. Open `index.html` in your browser.

You can also serve it locally if you prefer:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Project structure

```
document-organizer/
├── index.html   # Page markup
├── style.css    # Theme, layout and dark mode styles
├── script.js    # Upload, filtering, sorting, preview and storage logic
└── README.md
```

## How it works

| Area | Details |
| --- | --- |
| Categories | Detected from the file extension (`getFileCategory` in `script.js`). |
| Text files | Read with `FileReader.readAsText` and shown as escaped plain text. |
| Other files | Read as data URLs and rendered as images, PDFs or downloads. |
| Sorting | Handled by `sortDocs`. "All" keeps the original upload order. |
| Theme | Stored as `data-theme` on `<html>` and saved to `localStorage`. |

## Limitations

- Files are stored in `localStorage`, which browsers usually cap at about 5 MB. If storage fills up, the app shows a warning and keeps your files only until you close the tab.
- Data stays on your device. It is not synced across browsers or devices.
- Office files (`.docx`, `.xlsx`, `.pptx`) cannot be previewed in the browser, so you can download them instead.

## Customising

- **Colours:** edit the CSS variables at the top of `style.css`. Light and dark themes have separate sets, and each file category has its own `--c-*` colour.
- **File categories:** add extensions in `getFileCategory` in `script.js`.
- **Sort options:** add an `<option>` to `#sortSelect` in `index.html` and a matching entry in the `keys` object inside `sortDocs`.

## Contributing

Issues and pull requests are welcome. For larger changes, please open an issue first to discuss what you would like to change.

## License

Add your preferred license here, for example [MIT](https://choosealicense.com/licenses/mit/).
