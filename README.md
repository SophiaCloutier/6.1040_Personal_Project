# Claimed!

Claimed! is a marketplace designed specifically for MIT senior sales, making it easier for students to discover, buy, and sell secondhand items within the MIT community.

## Run the alpha

See [local setup](SETUP.md) for Docker MongoDB and the Bun/Vue app. The interface runs at http://localhost:3000 after building and starting the backend.

The alpha supports accounts, fixed-price listings, exclusive claims, external payment reporting, and seller confirmation. See [the alpha journey and recording script](ALPHA.md). Implementation specifications are in `backend/design/`; the original `Design/` documents remain unchanged and changes are denoted in the Notebook.

The marketplace has a responsive grid and public item pages. Guests can browse without an account; claiming requires sign-in. Sellers can upload photos and create custom tags, and buyers can combine keyword search with tag, price, and availability filters.

## Design

- [Problem Framing](Design/1.%20Problem%20Framing.md)
- [Stakeholders](Design/1.1%20Stakeholders.md)
- [Application Pitch](Design/2.%20Application%20Pitch.md)
- [Concepts & Reactions](Design/3.%20Concepts%20%26%20Reactions.md)
- [UI Sketches](Design/4.%20UI%20Sketches.md)
- [User Journey](Design/5.%20User%20Journey.md)
- [Notebook](Notebook.md)

## Demo

<video controls width="100%" src="https://github.com/SophiaCloutier/6.1040_Personal_Project/raw/refs/heads/main/Alpha%20Demo.mp4">
	<a href="Alpha%20Demo.mp4">Watch the alpha demo</a>
</video>

If the video player does not load, [download the alpha demo](Alpha%20Demo.mp4).