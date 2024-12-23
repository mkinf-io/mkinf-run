# Anonymize PII API

The Anonymize PII API by Glaider enables the detection and anonymization of personally identifiable information (PII) in text data. This is particularly useful for preprocessing data before utilizing AI models or for secure data storage.

## Endpoint

```http
POST https://api.glaider.it/v1/anonymize-pii
```

## Headers

| Header         | Value                  |
|----------------|------------------------|
| Authorization  | Bearer `YOUR_API_KEY`  |
| Content-Type   | application/json       |

**Note:** Replace `YOUR_API_KEY` with your actual API key.

## Request Body Parameters

| Parameter | Type   | Required | Description            |
|-----------|--------|----------|------------------------|
| prompt    | string | Yes      | The input text to anonymize |

## Example Request

```json
{
  "prompt": "Hi, I'm Lorenzo Smith working at Google. You can reach me at lorenzo.smith@gmail.com or visit our office at 1600 Amphitheatre Parkway, Mountain View. My API key is sk_test_4eC39HqLyjWDarja4fqee2d23dtT1zdp7dc and my credit card is 4532-7153-3790-4421. Our server IP is 192.168.1.1"
}
```

## Responses

### Success Response

- **Status Code:** 200 OK
- **Content-Type:** application/json
- **Body:**

  ```json
  {
    "anonymized_text": "Hi, I'm [PER_0] working at [ORG_0]. You can reach me at [Email Address_0] or visit our office at 1600 [LOC_0], [LOC_1]. My API key is [Access Token_0] and my credit card is [Credit Card Number_0]. Our server IP is [IPv4 Address_0]",
    "entities": {
      "[PER_0]": "Lorenzo Smith",
      "[ORG_0]": "Google",
      "[Email Address_0]": "lorenzo.smith@gmail.com",
      "[LOC_0]": "Amphitheatre Parkway",
      "[LOC_1]": "Mountain View",
      "[Access Token_0]": "sk_test_4eC39HqLyjWDarja4fqee2d23dtT1zdp7dc",
      "[Credit Card Number_0]": "4532-7153-3790-4421",
      "[IPv4 Address_0]": "192.168.1.1"
    }
  }
  ```

### Error Responses

#### 400 Bad Request

```json
{
  "status": "error",
  "message": "Invalid input: The 'prompt' field is required."
}
```

#### 401 Unauthorized

```json
{
  "status": "error",
  "message": "Unauthorized: Invalid or missing API key."
}
```

#### 429 Too Many Requests

```json
{
  "status": "error",
  "message": "Rate limit exceeded: Please try again later."
}
```

#### 500 Internal Server Error

```json
{
  "status": "error",
  "message": "Internal server error."
}
```

## Response Fields Description

- **anonymized_text** (`string`): The input text with all detected sensitive information replaced with anonymized tokens.
- **entities** (`object`): A mapping of anonymized tokens to their original values.

## Supported Entity Types

The API automatically detects and anonymizes the following types of sensitive information:

- Personal names (e.g., `[PER_n]`)
- Location names (e.g., `[LOC_n]`)
- Organization names (e.g., `[ORG_n]`)
- Email addresses (e.g., `[Email Address_n]`)
- IP addresses (e.g., `[IPv4 Address_n]`)
- Access tokens (e.g., `[Access Token_n]`)
- API keys (e.g., `[API Key_n]`)
- Credit card numbers (e.g., `[Credit Card Number_n]`)

## Usage Example

### Python

```python
import requests

url = "https://api.glaider.it/v1/anonymize-pii"
api_key = "YOUR_API_KEY"

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

data = {
    "prompt": "Hi, I'm Lorenzo Smith working at Google. You can reach me at lorenzo.smith@gmail.com or visit our office at 1600 Amphitheatre Parkway, Mountain View. My API key is sk_test_4eC39HqLyjWDarja4fqee2d23dtT1zdp7dc and my credit card is 4532-7153-3790-4421. Our server IP is 192.168.1.1"
}

response = requests.post(url, json=data, headers=headers)
print(response.json())
```

## Additional Information

- **Rate Limiting:** The API enforces rate limits to ensure fair usage. If you exceed the rate limit, you will receive a `429 Too Many Requests` response. Implement appropriate retry logic with exponential backoff in your applications.

- **Error Handling:** Always check the response status code and handle errors appropriately in your application.

- **Security:** Keep your API key secure. Do not expose it in client-side code, public repositories, or logs.

- **Support:** For assistance or inquiries, contact our support team at info@glaider.it.

* * *

For more details, visit the [Anonymize PII API Documentation](https://docs.glaider.it/api-reference/features/anonymize-pii). 