# Privacy Policy for Franklink Career Agent

**Last Updated**: November 7, 2025
**Effective Date**: November 7, 2025

---

## Introduction

Welcome to Franklink ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our career guidance service via iMessage (the "Service").

By using Franklink, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with our policies and practices, please do not use our Service.

---

## 1. Information We Collect

### 1.1 Information You Provide Directly

When you use Franklink, you may provide us with the following information:

- **Phone Number**: Your phone number used for iMessage communication (collected via SendBlue API)
- **Name**: Your full name for personalization
- **School Email Address**: Your .edu email address (required for authentication and verification)
- **LinkedIn Profile**: Your LinkedIn profile URL (optional)
- **Career Interests**: Information about your career goals, preferences, and interests shared during conversations
- **Academic Information**: Your school, major, graduation year, and related academic details
- **Messages**: Conversations with our AI career counselor via iMessage

### 1.2 Information Collected Through Google OAuth

When you connect your Google account, we collect:

- **Email Address**: Your school email address (.edu domain required)
- **Email Content**: With your explicit permission, we may read your Gmail messages to identify career-related opportunities (scholarships, internships, job postings) shared via email
- **Calendar Information**: With your permission, we may access your Google Calendar to add application deadlines and career event reminders
- **Profile Information**: Your name and profile picture from your Google account

### 1.3 Information Collected Automatically

- **Usage Data**: Information about how you interact with the Service, including message timestamps and conversation flow
- **Technical Data**: Device type, operating system, iMessage version (collected through SendBlue API)
- **Log Data**: Server logs, error reports, and diagnostic information

### 1.4 Information from Third-Party Sources

- **LinkedIn Data**: If you provide your LinkedIn profile URL, we may scrape publicly available information from your profile (work experience, education, skills)
- **Web Content**: We may extract information from URLs you share (job postings, scholarship announcements)
- **Reddit & Public Forums**: We aggregate publicly available career opportunities from Reddit and other public sources

---

## 2. How We Use Your Information

We use the collected information for the following purposes:

### 2.1 Provide and Improve the Service

- Deliver personalized career guidance and recommendations
- Answer your questions about careers, internships, and job opportunities
- Match you with relevant career opportunities based on your profile and interests
- Improve our AI models and recommendation algorithms (**Note**: We use only your career questions, preferences, and feedback for AI improvement - we do NOT use Gmail or Calendar data for AI training or model development)
- Analyze usage patterns to enhance user experience (anonymized data only, does not include Google user data)

### 2.2 Communication

- Send you career opportunity alerts via iMessage
- Provide deadline reminders for applications
- Send verification codes and authentication messages via email
- Respond to your inquiries and support requests

### 2.3 Google Integration Features

- **Gmail Reading**: Scan your email for career-related opportunities from school career centers, recruiters, and organizations
- **Email Sending**: Send verification codes and important notifications to your school email
- **Calendar Management**: Add application deadlines and career event reminders to your Google Calendar

### 2.4 Legal and Security

- Comply with legal obligations and enforce our Terms of Service
- Detect, prevent, and address fraud, security issues, and technical problems
- Protect the rights, property, and safety of Franklink, our users, and the public

---

## 3. How We Share Your Information

We do not sell your personal information to third parties. We may share your information in the following limited circumstances:

### 3.1 Service Providers

We share information with trusted third-party service providers who assist us in operating the Service:

- **SendBlue**: iMessage delivery platform (phone number, messages)
- **Supabase**: Database hosting (all user data, encrypted at rest)
- **Microsoft Azure OpenAI**: AI language model for generating responses (conversation context, anonymized when possible)
- **Google**: OAuth authentication and API services (email, calendar data)
- **Sentry**: Error monitoring and debugging (anonymized error logs)

All service providers are contractually obligated to protect your information and use it only for the purposes we specify.

### 3.2 Legal Requirements

We may disclose your information if required by law, court order, or governmental request, or to:

- Comply with legal processes
- Enforce our Terms of Service
- Protect our rights, privacy, safety, or property
- Prevent fraud or security issues

### 3.3 Business Transfers

If Franklink is involved in a merger, acquisition, or sale of assets, your information may be transferred. We will notify you before your information is transferred and becomes subject to a different privacy policy.

### 3.4 With Your Consent

We may share your information with third parties when you explicitly consent to such sharing.

---

## 4. Google API Services User Data Policy

**IMPORTANT**: Franklink's use of information received from Google APIs adheres to [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements.

### 4.1 Limited Use Requirements Compliance

**Our Commitment**: We use Google user data (Gmail, Calendar) **ONLY** to provide user-facing features in Franklink that you explicitly request. Specifically:

**What We Do With Google Data:**
- ✓ Scan your Gmail for career-related emails (jobs, internships, scholarships) to surface opportunities
- ✓ Create calendar events in your Google Calendar for application deadlines you want to track
- ✓ Send verification emails to your .edu address when you request them

**What We Do NOT Do With Google Data:**
- ✗ We do NOT store Gmail message content on our servers
- ✗ We do NOT use Gmail or Calendar data for advertising
- ✗ We do NOT sell or rent Google user data to anyone
- ✗ We do NOT train AI models on your Gmail or Calendar data
- ✗ We do NOT allow humans to read your Gmail unless you report a bug and explicitly consent
- ✗ We do NOT share Google data with third parties except as required to provide the Service
- ✗ We do NOT use Gmail data for purposes unrelated to career guidance

### 4.2 Specific Google API Use

**Gmail API (gmail.readonly, gmail.send)**:
- **How We Use It**: We scan your incoming emails in real-time for career-related keywords (e.g., "internship," "job offer," "scholarship"). When we find relevant emails, we extract only the opportunity details (title, deadline, URL) to show you in Franklink.
- **What We Store**: We store **only** the extracted opportunity metadata (title, deadline, organization name). We do **NOT** store the full email content.
- **Transient Processing**: Email content is processed transiently (in memory) and immediately discarded after extracting opportunity details.
- **Email Sending**: We use gmail.send only to send verification codes and critical notifications to your .edu email at your request.

**Google Calendar API (calendar.events)**:
- **How We Use It**: We create new calendar events for application deadlines when you ask us to remind you about an opportunity.
- **What We Do NOT Do**: We do not read, modify, or delete your existing calendar events without your explicit request.
- **User Control**: You can view and delete these calendar events directly in Google Calendar at any time.

**Google OAuth (openid, userinfo.email, userinfo.profile)**:
- **How We Use It**: We use OAuth 2.0 to securely verify your .edu email address and authenticate your identity.
- **What We Store**: We store your email address, name, and profile picture from your Google account for account personalization.

### 4.3 Data Minimization and Scope Justification

We request **only** the minimum Google OAuth scopes necessary to provide our career guidance features:

| Scope | Purpose | Why Necessary |
|-------|---------|---------------|
| openid | Verify your identity | Required for secure authentication |
| userinfo.email | Access your email address | Required to verify .edu status |
| userinfo.profile | Access your name and photo | Used for account personalization |
| gmail.readonly | Read Gmail messages | **Only** to scan for career opportunities |
| gmail.send | Send emails on your behalf | Send verification codes to your .edu email |
| calendar.events | Manage calendar events | Create deadline reminders you request |

### 4.4 Third-Party Data Sharing Restrictions

**Google user data is subject to stricter restrictions** than other data we collect:

- **Azure OpenAI**: We do **NOT** send Gmail content or Calendar data to OpenAI for AI processing. We only send your general career questions and profile information (NOT from Google).
- **Service Providers**: Google data stays within our secure database (Supabase) and is not shared with other service providers.
- **Aggregation**: We may create anonymized statistics about opportunity types (e.g., "50% of users saved internship opportunities"), but these do NOT include any identifiable Google user data.

### 4.5 Google Data Retention

**Gmail Data**:
- Email content: **NOT stored** (processed transiently only)
- Extracted opportunities: Stored until you delete them or for 1 year, whichever is sooner
- OAuth tokens: Stored securely until you revoke access or delete your account

**Calendar Data**:
- Events we create: Remain in your Google Calendar until you delete them
- We do not retain a separate copy of calendar events

### 4.6 User Controls for Google Data

You can control your Google data at any time:

1. **Revoke Access**: Visit https://myaccount.google.com/permissions and remove "Franklink Career Agent"
2. **Delete Calendar Events**: Delete events we created directly in Google Calendar
3. **Delete Account**: Message "delete my account" to permanently delete all data including OAuth tokens
4. **View Permissions**: See exactly what Google data we can access in your Google Account settings

---

## 5. Data Storage and Security

### 5.1 Where We Store Your Data

Your data is stored in:

- **Supabase** (PostgreSQL database): Hosted in the United States with encryption at rest
- **Redis Cache**: Temporary session data, automatically expires
- **Google Servers**: OAuth tokens and calendar data (as per Google's security standards)

### 5.2 Security Measures

We implement industry-standard security measures to protect your information:

- **Encryption**: All data is encrypted in transit (TLS/HTTPS) and at rest (AES-256)
- **OAuth 2.0**: Secure authentication with CSRF protection and state validation
- **Access Controls**: Database access restricted to authorized personnel only
- **Regular Audits**: Security audits and vulnerability assessments
- **Automatic Token Refresh**: OAuth tokens are automatically refreshed to maintain security
- **State Expiration**: OAuth state parameters expire after 10 minutes to prevent replay attacks

### 5.3 Data Retention

- **Active Users**: We retain your data as long as your account is active
- **Inactive Users**: Data is automatically deleted after 2 years of inactivity
- **OAuth Tokens**: Refresh tokens are stored securely and refreshed automatically. Expired tokens are deleted.
- **Conversation History**: Stored for up to 1 year to improve service quality
- **Logs**: Server logs are retained for 90 days for debugging and security purposes

---

## 6. Your Privacy Rights

### 6.1 Access and Correction

You have the right to:

- **Access**: Request a copy of the personal information we hold about you
- **Correction**: Request correction of inaccurate or incomplete information
- **Portability**: Request your data in a machine-readable format

To exercise these rights, message "data request" to Franklink via iMessage or email privacy@franklink.ai.

### 6.2 Deletion

You have the right to request deletion of your personal information by:

- Messaging "delete my account" to Franklink via iMessage
- Emailing privacy@franklink.ai with your phone number

Upon deletion request, we will:

1. Remove your profile and personal information from our database within 30 days
2. Revoke OAuth tokens and disconnect your Google account
3. Delete conversation history and cached data
4. Notify you when deletion is complete

**Note**: Some information may be retained for legal or security purposes as required by law.

### 6.3 Revoke Google OAuth Access

You can revoke Franklink's access to your Google account at any time by:

1. Visiting: https://myaccount.google.com/permissions
2. Finding "Franklink Career Agent"
3. Clicking "Remove Access"

When you revoke access:

- We will no longer be able to read your Gmail or access your Calendar
- Stored OAuth tokens will be immediately invalidated
- Your existing career recommendations will remain available
- You can re-authorize at any time to restore functionality

### 6.4 Opt-Out of Communications

You can stop receiving messages from Franklink at any time by:

- Messaging "stop" or "unsubscribe" via iMessage
- We will immediately cease all proactive messages (you can still message us for support)

### 6.5 California Privacy Rights (CCPA)

If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):

- Right to know what personal information we collect
- Right to delete personal information
- Right to opt-out of sale (we do not sell personal information)
- Right to non-discrimination for exercising your rights

To exercise CCPA rights, email privacy@franklink.ai with "California Privacy Request" in the subject line.

### 6.6 GDPR Rights (European Users)

If you are in the European Economic Area (EEA), you have rights under the General Data Protection Regulation (GDPR):

- Right to access, rectification, erasure, and data portability
- Right to restrict or object to processing
- Right to withdraw consent
- Right to lodge a complaint with a supervisory authority

**Legal Basis for Processing**: We process your data based on:
- Consent (for Google OAuth)
- Contractual necessity (to provide the Service)
- Legitimate interests (to improve and secure the Service)

---

## 7. Third-Party Links and Services

Our Service may contain links to third-party websites, services, or career opportunities. We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies before providing any information.

Third-party services we integrate with:

- **LinkedIn**: Public profile scraping (subject to LinkedIn's terms)
- **Job Boards**: Handshake, Indeed, Eventbrite (we extract publicly available data)
- **Reddit**: Public career opportunity posts
- **SendBlue**: iMessage delivery (see SendBlue Privacy Policy)
- **Google**: OAuth, Gmail, Calendar (see Google Privacy Policy)

---

## 8. Children's Privacy

Franklink is intended for college students aged 18 and older. We do not knowingly collect information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately at privacy@franklink.ai, and we will delete it.

---

## 9. International Data Transfers

Your information may be transferred to and processed in the United States, where our servers are located. By using our Service, you consent to the transfer of your information to the United States.

If you are located in the EEA or other regions with data protection laws, we ensure appropriate safeguards are in place, including:

- Standard Contractual Clauses (SCCs) with service providers
- Adherence to EU-U.S. Data Privacy Framework principles
- Encryption and security measures during transfer

---

## 10. Changes to This Privacy Policy

We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of material changes by:

- Posting the new Privacy Policy on our website
- Updating the "Last Updated" date at the top
- Sending a message via iMessage for significant changes

Your continued use of the Service after changes become effective constitutes acceptance of the updated Privacy Policy.

---

## 11. Educational Institutions (FERPA Compliance)

For users whose school email is provided through an educational institution:

- We comply with the Family Educational Rights and Privacy Act (FERPA) when applicable
- We do not disclose student education records without consent
- Educational institutions may request information about their students' use of our Service
- We maintain appropriate data security measures to protect student information

---

## 12. Contact Us

If you have questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us:

**Email**: privacy@franklink.ai
**Support**: Message "help" to Franklink via iMessage
**Mail**: Franklink Inc., 131 Continental Dr Suite 305, Newark, Delaware, 19713
**CTO**: Zhiyang Zhong
---

## 13. Transparency Report

We are committed to transparency. We will publish an annual transparency report detailing:

- Number of user data requests from law enforcement
- Types of data requested
- Number of accounts affected
- Our response to such requests

---

## 14. Your Consent

By using Franklink, you acknowledge that you have read and understood this Privacy Policy and consent to the collection, use, and sharing of your information as described.

For Google OAuth specifically, you consent to:

- Franklink accessing your school email address (.edu)
- Reading your Gmail for career-related opportunities (with your permission)
- Sending verification emails to your school email
- Creating calendar events for application deadlines (with your permission)

You may withdraw consent at any time by revoking OAuth access or deleting your account.

---

## Appendix A: Data Categories and Processing

| Data Type | Purpose | Legal Basis | Retention | Third Parties |
|-----------|---------|-------------|-----------|---------------|
| Phone Number | iMessage delivery | Contractual | Active + 2 years | SendBlue |
| Name | Personalization | Contractual | Active + 2 years | Azure OpenAI |
| School Email | Verification, communication | Consent | Active + 2 years | Google |
| Gmail Content | Career opportunity extraction | Consent | Not stored (scanned only) | None |
| Calendar Data | Deadline management | Consent | Active + 1 year | Google |
| LinkedIn Profile | Career recommendations | Consent | Active + 2 years | None |
| Conversation History | Service improvement | Legitimate Interest | 1 year | Azure OpenAI |
| OAuth Tokens | Authentication | Consent | Active + 90 days | Google |
| Usage Logs | Debugging, security | Legitimate Interest | 90 days | Sentry |

---

## Appendix B: OAuth Scopes Explanation

We request the following Google OAuth scopes:

1. **openid**: Verify your identity
2. **userinfo.email**: Access your email address for verification
3. **userinfo.profile**: Access your name and profile picture
4. **gmail.readonly**: Read your Gmail to find career opportunities
5. **gmail.send**: Send verification codes and notifications to your email
6. **calendar.events**: Create, update, and delete calendar events for deadlines

You can revoke any of these permissions at any time via Google Account settings.

---

**This Privacy Policy is effective as of November 4, 2025.**
**Last Reviewed for Google OAuth Compliance**: November 4, 2025

For the most current version, visit: https://franklink.ai/privacy

---

**Document Control**:
- Version: 1.0
- Google API Services User Data Policy Compliance: Yes
- Limited Use Requirements: Fully Compliant
- Next Review Date: May 4, 2026 (6 months)

---

© 2025 Franklink Inc. All rights reserved.
