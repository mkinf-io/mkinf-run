import { define, intersection, string } from 'superstruct';

export const isBase64ImageOnly = () => define('base64Image', (value) => {
	if (typeof value != "string") { return false; }
	// Regex to check if it's a Base64 string with a data URI (image MIME types)
	const base64ImagePattern = /^data:image\/(png|jpeg|jpg|gif|bmp|webp);base64,/;
	// Check if the string matches the pattern
	if (base64ImagePattern.test(value)) {
		return true;
	}
	// If no data URI prefix, decode and check for magic numbers (optional)
	try {
		const decoded = atob(value.replace(/^data:.*;base64,/, ''));
		const byteArray = Uint8Array.from(decoded, (char) => char.charCodeAt(0));

		// Common image magic numbers
		const pngMagic = [0x89, 0x50, 0x4e, 0x47]; // PNG: \x89PNG
		const jpegMagic = [0xff, 0xd8, 0xff]; // JPEG: \xFF\xD8\xFF
		const gifMagic = [0x47, 0x49, 0x46]; // GIF: GIF89a or GIF87a

		// Check for PNG
		if (byteArray.slice(0, 4).every((byte, i) => byte === pngMagic[i])) {
			return true;
		}
		// Check for JPEG
		if (byteArray.slice(0, 3).every((byte, i) => byte === jpegMagic[i])) {
			return true;
		}
		// Check for GIF
		if (byteArray.slice(0, 3).every((byte, i) => byte === gifMagic[i])) {
			return true;
		}
		// Add more file type checks if needed
	} catch (e) {
		console.error("Invalid Base64 string or decoding error", e);
	}
	return false;
});

export const isBase64Image = () => intersection([string(), isBase64ImageOnly()]);
