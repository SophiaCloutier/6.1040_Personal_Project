# ImageUploading
## Purpose
Store durable, displayable photographs supplied by users.
## Principle
A valid JPEG, PNG, or WebP photograph is decoded, oriented, resized, and stored as a fresh WebP file. The resulting image URL remains available across application restarts. Invalid or oversized images are refused.
## Types
```types
```
## State
```state
a set of Images with
  a file String
```
## Actions
```actions
store (data: String, mime: String) : returns (image: String)
  where data is not a valid base64 encoded JPEG, PNG, or WebP photograph of at most 5 MB and at most 25 million pixels, or mime does not match its format
  then
    refuses INVALID_IMAGE "Choose a valid JPEG, PNG, or WebP photo up to 5 MB."
  where the photograph is valid
  then
    orient and resize to fit within 1600 by 1600 pixels without enlargement
    encode as WebP without original metadata and write under a fresh identity
    returns image
```
## Queries
```queries
```

