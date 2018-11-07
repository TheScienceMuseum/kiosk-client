# Kiosk Client Application

## Package Format

A package is a gziped tar file that contains a `maniest.json` file in it's root
directory. The filename is also significant and should always be in the format
`<package_name>_<package_version>.package`. For this reason, package names should
not contain and `_` characters.

### Directory Structure

An example directory structure for an imaginary package called "Medical Instruments 
through history", this is the 3rd version of the package.

```bash
medicalinstruments_3.package
├── assets
│   ├── css
│   │   └── style.css
│   └── images
│       └── test-01.jpeg
├── index.html
└── manifest.json
```

The only important file from the kiosk client's point of view is the `manifest.json`
which at a minimum should have the following content:

```json
{
  "name": "medicalinstruments", // <string> The internal name of the package no _ (used to delim version from name)
  "version": 3,                 // <integer> The internal version of the package
  "main": "index.html"          // <string> The html file that should be loaded
}
```
