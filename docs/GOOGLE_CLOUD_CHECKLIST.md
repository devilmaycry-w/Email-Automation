# Google Cloud Production Checklist

## 🎯 Complete this checklist to remove the "Google hasn't verified this app" warning

### 📋 Pre-Submission Checklist

#### OAuth Consent Screen - App Information
- [ ] **App name:** CodexCity - AI Email Automation
- [ ] **User support email:** Your business email
- [ ] **App logo:** 120x120px logo uploaded
- [ ] **App domain:** https://silly-paprenjak-c84f70.netlify.app

#### OAuth Consent Screen - App Domain
- [ ] **Homepage:** https://silly-paprenjak-c84f70.netlify.app
- [ ] **Privacy policy:** https://silly-paprenjak-c84f70.netlify.app/privacy.html
- [ ] **Terms of service:** https://silly-paprenjak-c84f70.netlify.app/terms.html

#### OAuth Consent Screen - Authorized Domains
- [ ] silly-paprenjak-c84f70.netlify.app
- [ ] netlify.app

#### OAuth Consent Screen - Scopes
- [ ] **Scope:** `https://www.googleapis.com/auth/gmail.modify`
- [ ] **Justification:** "Required to read incoming emails, classify them using AI, and send automated responses based on user-configured templates for business email automation."

#### OAuth Consent Screen - Test Users (Temporary)
- [ ] Add your email address
- [ ] Add any other test users (max 100)

#### Developer Contact Information
- [ ] **Email addresses:** Your business email

### 🔧 OAuth Client Configuration

#### Credentials > OAuth 2.0 Client IDs

**Authorized JavaScript origins:**
- [ ] https://silly-paprenjak-c84f70.netlify.app
- [ ] http://localhost:5173 (for development)

**Authorized redirect URIs:**
- [ ] https://silly-paprenjak-c84f70.netlify.app/auth/gmail/callback
- [ ] http://localhost:5173/auth/gmail/callback
- [ ] https://[your-supabase-id].supabase.co/auth/v1/callback

### 📄 Required Documentation

#### Privacy Policy Requirements
- [ ] Data collection practices clearly explained
- [ ] Gmail API usage and scope explained
- [ ] Data retention policies specified
- [ ] User rights and controls outlined
- [ ] Contact information provided

#### Terms of Service Requirements
- [ ] Service description and limitations
- [ ] User responsibilities and prohibited uses
- [ ] Liability limitations and disclaimers
- [ ] Termination conditions
- [ ] Governing law specified

### 🚀 Submission Process

#### Before Submitting
- [ ] Test the complete OAuth flow
- [ ] Verify all URLs are accessible
- [ ] Ensure privacy policy and terms are live
- [ ] Test with multiple Gmail accounts
- [ ] Verify email sending works correctly

#### Submission Steps
1. [ ] Go to OAuth consent screen in Google Cloud Console
2. [ ] Click "PUBLISH APP" 
3. [ ] Review all information is correct
4. [ ] Submit for verification
5. [ ] Wait for Google's review (can take 1-7 days)

#### Post-Submission
- [ ] Monitor Google Cloud Console for verification status
- [ ] Respond to any Google requests for additional information
- [ ] Test the app once verification is complete

### ⚠️ Common Rejection Reasons

**Avoid these issues:**
- [ ] Incomplete or inaccurate app information
- [ ] Privacy policy doesn't match actual data usage
- [ ] Broken links to privacy policy or terms
- [ ] Overly broad scope requests
- [ ] Insufficient justification for Gmail access
- [ ] Missing or inadequate contact information

### 🎉 Success Indicators

**Your app is ready when:**
- [ ] Users see "CodexCity - AI Email Automation" instead of "Unverified app"
- [ ] No warning messages during OAuth flow
- [ ] Gmail integration works seamlessly
- [ ] All legal pages are accessible and complete

### 📞 Support Resources

**If you need help:**
- [Google OAuth Verification Guide](https://support.google.com/cloud/answer/9110914)
- [Gmail API Policies](https://developers.google.com/gmail/api/auth/scopes)
- [OAuth Consent Screen Help](https://support.google.com/cloud/answer/10311615)

### 🔄 Timeline Expectations

- **Preparation:** 1-2 hours
- **Google Review:** 1-7 business days
- **Possible back-and-forth:** 1-3 additional days
- **Total time:** 2-10 business days

### ✅ Final Verification

Once approved, test with a fresh Google account to ensure:
- [ ] No "unverified app" warnings appear
- [ ] OAuth flow completes successfully
- [ ] Gmail permissions are granted correctly
- [ ] Email automation works as expected