import SessionsClient from "./_components/SessionsClient";

export const metadata = {
    title: "Session Management | Verity Systems",
    description: "Manage active user sessions across the system.",
};

export default function SessionsPage() {
    return (
        <div className="space-y-6">
            <SessionsClient />
        </div>
    );
}
