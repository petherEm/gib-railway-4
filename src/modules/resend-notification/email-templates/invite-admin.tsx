interface EmailTemplateProps {
  token: string;
  user: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

export const InviteAdminEmailTemplate: React.FC<
  Readonly<EmailTemplateProps>
> = ({ token, user }) => {
  const inviteUrl = `${
    process.env.ADMIN_INVITE_URL_PREFIX || "https://admin.gibbarosa.io"
  }/invite?token=${token}`;

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "32px",
        paddingTop: "36px",
        color: "#090909 !important",
        backgroundColor: "#F9F9F9",
        fontFamily: "Arial, sans-serif",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      <h1
        style={{
          fontSize: "24px",
          fontWeight: "600",
          marginBottom: "24px",
        }}
      >
        Welcome to the Admin Team
      </h1>
      <p
        style={{
          fontSize: "16px",
          color: "#090909 !important",
          lineHeight: "1.5",
          marginBottom: "24px",
        }}
      >
        Hello {user.first_name || ""},
        <br />
        You've been invited to join our admin team. Click the button below to
        accept the invitation.
      </p>
      <a
        href={inviteUrl}
        style={{
          color: "#F9F9F9",
          textDecoration: "none",
          marginBottom: "24px",
          display: "block",
          backgroundColor: "#090909",
          width: "100%",
          padding: "12px 0",
          borderRadius: "999px",
          textAlign: "center",
        }}
      >
        Accept Invitation
      </a>
      <p
        style={{
          fontSize: "16px",
          color: "#090909 !important",
          lineHeight: "1.5",
          marginBottom: "32px",
        }}
      >
        If you didn't expect this invitation, please ignore this email.
      </p>
    </div>
  );
};
