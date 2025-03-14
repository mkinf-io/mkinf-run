import tiktoken, { TiktokenEncoding } from 'tiktoken';

export default function countTokens(prompt: string, model: TiktokenEncoding = "cl100k_base"): number {
	// Get the tokenizer for the specified model
	const encoding = tiktoken.get_encoding(model);
	// Tokenize the prompt and count tokens
	const tokens = encoding.encode(prompt);
	return tokens.length;
}
