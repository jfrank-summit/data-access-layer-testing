## API Usage

You can interact with the server using the following curl commands:

### Submit Data

To submit data to the chain and store it in the database:

```bash
curl -X POST http://localhost:3000/submit \
     -H "Content-Type: application/json" \
     -d '{"data": "Your data here"}'
```

This will return a JSON response with the hash of the stored data:

```json
{
    "hash": "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
```

### Retrieve Data

To retrieve data from the database using its hash:

```bash
curl http://localhost:3000/retrieve/1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

Replace the hash in the URL with the actual hash you received when submitting the data.

This will return a JSON response with the retrieved data:

```json
{
    "data": "Your data here"
}
```

If the data is not found, you'll receive a 404 error response.

Note: Make sure the server is running (use `yarn start:server`) before executing these commands.
