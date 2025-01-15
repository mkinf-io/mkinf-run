import tiktoken


def count_tokens(prompt: str, model: str = "cl100k_base") -> int:
    # Get the tokenizer for the specified model
    encoding = tiktoken.get_encoding(model)
    # Tokenize the prompt and count tokens
    tokens = encoding.encode(prompt)
    return len(tokens)
