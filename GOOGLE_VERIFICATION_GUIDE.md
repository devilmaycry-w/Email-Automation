# Google OAuth App Verification Guide for CodexCity

This guide provides step-by-step instructions for verifying your Gmail API application with Google to remove the "unverified app" warning and enable production use.

## 📋 Prerequisites

Before starting the verification process, ensure you have:

- ✅ A deployed application with working Gmail integration
- ✅ Privacy Policy and Terms of Service pages (already created)
- ✅ Valid domain ownership
- ✅ Business email address for communication with Google

## 🔗 Required URLs for Verification

### Application Information
- **Application URL**: `https://silly-paprenjak-c84f70.netlify.app`
- **Privacy Policy URL**: `https://silly-paprenjak-c84f70.netlify.app/privacy-policy.html`
- **Terms of Service URL**: `https://silly-paprenjak-c84f70.netlify.app/terms-of-service.html`

### Contact Information
- **User Support Email**: `realankrit@gmail.com`
- **Developer Contact Email**: `codexcity.biz@gmail.com`

## 🚀 Step-by-Step Verification Process

### Step 1: Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (the one with your Gmail API credentials)
3. Navigate to **APIs & Services** > **OAuth consent screen**

### Step 2: Configure OAuth Consent Screen

#### Basic Information
- **App name**: `CodexCity - AI Email Automation`
- **User support email**: `realankrit@gmail.com`
- **App logo**: Upload your CodexCity logo (optional but recommended)
- **App domain**: `silly-paprenjak-c84f70.netlify.app`
- **Authorized domains**: Add `netlify.app` and your custom domain if you have one

#### App Information
- **Application homepage link**: `https://silly-paprenjak-c84f70.netlify.app`
- **Application privacy policy link**: `https://silly-paprenjak-c84f70.netlify.app/privacy-policy.html`
- **Application terms of service link**: `https://silly-paprenjak-c84f70.netlify.app/terms-of-service.html`

#### Developer Contact Information
- **Email addresses**: `codexcity.biz@gmail.com`

### Step 3: Configure Scopes
Add the following OAuth scopes:
- `https://www.googleapis.com/auth/gmail.modify`
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`

### Step 4: Add Test Users (if needed)
While in development/testing mode, add test user emails:
- Your own email address
- Any beta testers' email addresses

### Step 5: Submit for Verification

#### Required Information for Submission
1. **App Description**: 
   ```
   CodexCity is an AI-powered email automation platform that helps small businesses 
   automate their email responses. The application uses Gmail API to:
   
   - Read incoming emails for AI classification
   - Generate personalized automated responses based on user-defined templates
   - Send replies through the user's Gmail account
   - Provide analytics and insights on email processing
   
   The app processes email metadata and content solely for automation purposes 
   and does not store full email content permanently.
   ```

2. **Justification for Sensitive Scopes**:
   ```
   Gmail Modify Scope Justification:
   - Read access: Required to fetch incoming emails for AI classification
   - Send access: Required to send automated responses on behalf of the user
   - Modify access: Required to mark emails as read/processed and organize responses
   
   The application provides legitimate business email automation services and 
   requires these permissions to function as designed. All access is user-initiated 
   and clearly explained during the OAuth consent process.
   ```

3. **Video Demonstration**: Create a 2-3 minute video showing:
   - User signing up and connecting Gmail
   - Email classification and template setup
   - Automated response generation
   - Privacy controls and data management

### Step 6: Domain Verification
1. Go to **Google Search Console**
2. Add and verify your domain: `silly-paprenjak-c84f70.netlify.app`
3. Use HTML file upload or DNS verification method

### Step 7: Security Assessment (if required)
For sensitive scopes, Google may require a security assessment:
- Prepare documentation of your security practices
- Ensure HTTPS is enabled (already done with Netlify)
- Document data handling and storage practices
- Provide information about access controls and encryption

## 📝 Verification Checklist

### Before Submission
- [ ] OAuth consent screen fully configured
- [ ] Privacy policy accessible and comprehensive
- [ ] Terms of service accessible and detailed
- [ ] Application fully functional with Gmail integration
- [ ] Domain verified in Google Search Console
- [ ] Test users can successfully use the application
- [ ] Video demonstration prepared
- [ ] Security documentation ready

### During Review Process
- [ ] Respond promptly to Google's requests for additional information
- [ ] Monitor the developer email for communication from Google
- [ ] Be prepared to provide additional documentation if requested
- [ ] Test the application regularly to ensure continued functionality

## ⏱️ Timeline Expectations

- **Initial Review**: 1-2 weeks for basic applications
- **Security Assessment**: 2-6 weeks for sensitive scopes
- **Additional Information Requests**: May extend timeline by 1-2 weeks each

## 🔧 Common Issues and Solutions

### Issue: "App Domain Not Verified"
**Solution**: Ensure domain is verified in Google Search Console and matches exactly

### Issue: "Privacy Policy Not Accessible"
**Solution**: Verify the privacy policy URL is publicly accessible and comprehensive

### Issue: "Insufficient Scope Justification"
**Solution**: Provide detailed explanation of why each scope is necessary for app functionality

### Issue: "Security Concerns"
**Solution**: Document security practices, encryption methods, and data handling procedures

## 📞 Support and Resources

### Google Support
- [OAuth Verification Support](https://support.google.com/cloud/contact/oauth_app_verification)
- [Google Cloud Console Help](https://cloud.google.com/support)

### Documentation
- [OAuth App Verification FAQ](https://support.google.com/cloud/answer/9110914)
- [OAuth Consent Screen Configuration](https://support.google.com/cloud/answer/10311615)

### Contact Information
- **Technical Issues**: `codexcity.biz@gmail.com`
- **User Support**: `realankrit@gmail.com`

## 🎯 Post-Verification Steps

Once verified:
1. Update OAuth consent screen to "In Production"
2. Remove test user restrictions
3. Monitor application usage and user feedback
4. Maintain compliance with Google's policies
5. Keep privacy policy and terms of service updated

---

**Note**: This verification process is essential for production use and user trust. Take time to ensure all requirements are met before submission to avoid delays or rejections.