
export async function extractDetailFromErrorResponse(res: Response) {
    try {
        const data = await res.json();

        if (data.detail) {
            return data.detail;
        } else {
            return null;
        }
    } catch (e) {
        console.warn("Failed to extract details: ", e);
        return null;
    }
}