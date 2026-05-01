export async function onRequestPost(context) {
    const db = context.env.DB;
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (!db) {
        return new Response(JSON.stringify({ error: 'Database connection error' }), { status: 500, headers });
    }

    try {
        const { id } = await context.request.json();

        if (!id) {
            return new Response(JSON.stringify({ error: 'Member ID is required' }), { status: 400, headers });
        }

        await db.prepare('DELETE FROM team WHERE id = ?').bind(id).run();

        return new Response(JSON.stringify({ success: true }), { status: 200, headers });

    } catch (error) {
        console.error('Error deleting team member:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
}
