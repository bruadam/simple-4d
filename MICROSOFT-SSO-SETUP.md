# Microsoft SSO Setup Guide

This guide walks you through setting up Microsoft Single Sign-On (SSO) with Supabase for the 4D BIM application.

## Prerequisites

- A Supabase project (see README-4D.md for initial setup)
- An Azure Active Directory (Microsoft Entra ID) account
- Admin access to Azure AD or Microsoft 365

## Step 1: Register Your Application in Azure AD

### 1.1 Access Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Sign in with your Microsoft account
3. Navigate to **Azure Active Directory** (or **Microsoft Entra ID**)

### 1.2 Register a New Application

1. In the left sidebar, click **App registrations**
2. Click **+ New registration**
3. Fill in the application details:
   - **Name**: `4D BIM Viewer` (or your preferred name)
   - **Supported account types**: Choose one of:
     - **Single tenant**: Only users in your organization
     - **Multitenant**: Users from any organization
     - **Personal Microsoft accounts**: Include personal accounts
   - **Redirect URI**:
     - Platform: **Web**
     - URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`

     Replace `<your-project-ref>` with your actual Supabase project reference ID.

4. Click **Register**

### 1.3 Note Your Application IDs

After registration, you'll see your application page. Note these values:

- **Application (client) ID**: Example: `12345678-1234-1234-1234-123456789012`
- **Directory (tenant) ID**: Example: `87654321-4321-4321-4321-210987654321`

You'll need these for Supabase configuration.

### 1.4 Create a Client Secret

1. In your app registration, go to **Certificates & secrets**
2. Click **+ New client secret**
3. Add a description: `Supabase Auth`
4. Select an expiration period (recommended: 24 months)
5. Click **Add**
6. **IMPORTANT**: Copy the **Value** immediately - you won't be able to see it again!

### 1.5 Configure API Permissions

1. Go to **API permissions**
2. Click **+ Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Add these permissions:
   - `openid`
   - `profile`
   - `email`
   - `User.Read`
6. Click **Add permissions**
7. (Optional) Click **Grant admin consent** if you have admin rights

### 1.6 Configure Authentication

1. Go to **Authentication** in the left sidebar
2. Under **Implicit grant and hybrid flows**, enable:
   - ✅ **ID tokens** (for implicit and hybrid flows)
3. Under **Advanced settings**:
   - Allow public client flows: **No**
4. Click **Save**

## Step 2: Configure Supabase

### 2.1 Access Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Providers**

### 2.2 Enable Azure (Microsoft) Provider

1. Scroll down to find **Azure** provider
2. Toggle it to **Enabled**
3. Fill in the configuration:

   **Azure Client ID**: Paste your Application (client) ID from Step 1.3

   **Azure Secret**: Paste your client secret value from Step 1.4

   **Azure Tenant ID**: Paste your Directory (tenant) ID from Step 1.3

4. (Optional) Configure **Azure URL** if using a custom domain:
   - For common endpoint (multi-tenant): `https://login.microsoftonline.com/common/v2.0`
   - For single tenant: `https://login.microsoftonline.com/{tenant-id}/v2.0`
   - For Microsoft accounts only: `https://login.microsoftonline.com/consumers/v2.0`

5. Click **Save**

### 2.3 Configure Redirect URLs

1. Still in Supabase Authentication settings
2. Go to **URL Configuration**
3. Add your application URLs to **Redirect URLs**:
   - Development: `http://localhost:8081` (or your Expo dev URL)
   - Production: `https://your-production-domain.com`

4. Click **Save**

## Step 3: Update Application Environment Variables

Update your `.env.local` file with Supabase credentials (if not already done):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

You don't need to add Azure credentials here - they're configured in Supabase.

## Step 4: Testing the Integration

### 4.1 Start Your Application

```bash
npm start
```

### 4.2 Test Microsoft Sign-In

1. Open your application in a web browser
2. Click the **Login** button
3. You should see the updated auth panel with **Sign in with Microsoft** button
4. Click **Sign in with Microsoft**
5. You should be redirected to Microsoft login page
6. Enter your Microsoft credentials
7. Grant consent if prompted
8. You should be redirected back to your application, now logged in

### 4.3 Verify Authentication

- Check that the user's email is displayed in the app
- Verify that database operations work (save project, etc.)
- Test sign out functionality

## Troubleshooting

### Redirect URI Mismatch

**Error**: `AADSTS50011: The redirect URI specified in the request does not match...`

**Solution**:
1. Double-check the redirect URI in Azure matches exactly: `https://<your-project-ref>.supabase.co/auth/v1/callback`
2. Ensure there are no trailing slashes
3. Wait a few minutes after making changes in Azure - they can take time to propagate

### Invalid Client Secret

**Error**: `AADSTS7000215: Invalid client secret provided`

**Solution**:
1. Generate a new client secret in Azure
2. Update the secret in Supabase immediately
3. Make sure you copied the **Value** not the **Secret ID**

### Consent Required

**Error**: `AADSTS65001: The user or administrator has not consented to use the application`

**Solution**:
1. Go to Azure AD → App registrations → Your app → API permissions
2. Click **Grant admin consent for [Your Organization]**
3. Or configure user consent settings in Azure AD

### CORS Errors

**Error**: CORS policy blocking the request

**Solution**:
1. Ensure your site URL is correctly configured in Supabase **URL Configuration**
2. Check that redirect URLs include your domain
3. For local development, make sure you're using the correct port

### Token Validation Errors

**Error**: Issues with token validation

**Solution**:
1. Verify the tenant ID is correct in Supabase
2. Check that API permissions include `openid`, `profile`, and `email`
3. Ensure ID tokens are enabled in Azure Authentication settings

## Security Best Practices

### 1. Client Secret Management

- **Never commit client secrets to version control**
- Store secrets securely in Supabase dashboard only
- Rotate secrets regularly (every 6-12 months)
- Use short expiration periods for dev/test secrets

### 2. Scope Management

- Only request the minimum scopes needed
- Review and remove unused API permissions
- Use delegated permissions, not application permissions (unless needed)

### 3. Redirect URL Validation

- Only add trusted domains to redirect URLs
- Use HTTPS in production
- Avoid wildcards in redirect URLs

### 4. Multi-Factor Authentication

- Encourage or require MFA for users
- Configure conditional access policies in Azure AD
- Monitor sign-in logs for suspicious activity

### 5. Token Lifetime

- Configure appropriate token lifetimes in Azure AD
- Implement token refresh in your application
- Use refresh tokens securely

## Advanced Configuration

### Custom Branding

Customize the Microsoft login experience:

1. In Azure AD, go to **Company branding**
2. Upload your logo and custom background
3. Configure custom text and colors
4. Users will see your branding on the Microsoft login page

### Conditional Access

Require specific conditions for sign-in:

1. Azure AD → Security → Conditional Access
2. Create new policy
3. Configure conditions (location, device, risk level)
4. Apply to your application

### Group-Based Access

Restrict access to specific groups:

1. Azure AD → Your app → Properties
2. Set **User assignment required** to **Yes**
3. Go to **Users and groups**
4. Assign specific users or groups
5. Users not in assigned groups won't be able to sign in

### Single Sign-Out

Configure sign-out behavior:

1. In your app, call `signOut()` from auth service
2. Optionally redirect to Microsoft logout:
   ```typescript
   window.location.href = 'https://login.microsoftonline.com/common/oauth2/v2.0/logout';
   ```

## Microsoft Accounts vs Azure AD

### Azure AD (Work/School Accounts)

- Best for: Enterprise applications, organizational users
- Tenant: Specific organization or common
- Features: Full AD integration, group policies, conditional access

### Personal Microsoft Accounts

- Best for: Consumer applications, personal users
- Tenant: Use `consumers` tenant
- Features: Xbox, Outlook.com, OneDrive integration

### Multi-Tenant Configuration

To support both:

1. Use `common` tenant in Azure configuration
2. Select **Accounts in any organizational directory and personal Microsoft accounts** during app registration

## Monitoring and Analytics

### Azure AD Sign-In Logs

1. Azure AD → Monitoring → Sign-in logs
2. Filter by application name
3. View successful and failed sign-ins
4. Export logs for analysis

### Supabase Auth Logs

1. Supabase Dashboard → Authentication → Users
2. View user creation and login events
3. Monitor auth events in realtime

## Migration from Email/Password

If you have existing email/password users:

1. **Email Matching**: Users can sign in with Microsoft using the same email
2. **Account Linking**: Implement custom logic to link accounts
3. **Migration Period**: Allow both auth methods during transition
4. **Communication**: Notify users about the new sign-in option

## Support and Resources

### Microsoft Documentation

- [Azure AD Documentation](https://docs.microsoft.com/azure/active-directory/)
- [Microsoft Identity Platform](https://docs.microsoft.com/azure/active-directory/develop/)
- [OAuth 2.0 and OpenID Connect](https://docs.microsoft.com/azure/active-directory/develop/active-directory-v2-protocols)

### Supabase Documentation

- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [OAuth Providers](https://supabase.com/docs/guides/auth/social-login)
- [Azure Provider Docs](https://supabase.com/docs/guides/auth/social-login/auth-azure)

### Getting Help

- Supabase Discord: [discord.supabase.com](https://discord.supabase.com)
- Azure Support: [Azure Portal](https://portal.azure.com)
- GitHub Issues: Report bugs in the repository

## Appendix: Common Tenant IDs

- **Common (multi-tenant)**: `common`
- **Organizations only**: `organizations`
- **Personal accounts only**: `consumers`
- **Specific tenant**: Use your actual tenant GUID

## Checklist

Before going to production:

- [ ] Client secret is stored securely (not in code)
- [ ] Redirect URIs are configured for production domain
- [ ] API permissions are minimal and approved
- [ ] HTTPS is enforced in production
- [ ] Token lifetimes are appropriately configured
- [ ] Monitoring and logging are enabled
- [ ] Error handling is implemented
- [ ] Users are informed about privacy/data usage
- [ ] Backup authentication method is available
- [ ] Testing completed with real Azure AD accounts

## Conclusion

You now have Microsoft SSO configured for your 4D BIM application! Users can sign in with their Microsoft work or personal accounts, providing a seamless and secure authentication experience.

For questions or issues, refer to the troubleshooting section or consult the official Microsoft and Supabase documentation.
