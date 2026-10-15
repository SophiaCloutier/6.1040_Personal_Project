# Images

[Upload](reaction:Images.Photos.Upload) requires a current authenticated session, then stores a validated photograph. The browser sends base64 file data through the generated typed API and receives a durable URL for the listing. The HTTP host serves only generated WebP filenames from local upload storage. Uploaded images are public listing assets.

```endpoints
Images.Photos.Upload at /images/upload
```
