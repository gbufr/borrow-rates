export async function querySubgraph(url, query, variables = {}) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query,
            variables,
        }),
    });
    const body = await response.json();
    if (body.errors) {
        throw new Error(`Subgraph error: ${JSON.stringify(body.errors)}`);
    }
    return body.data;
}
