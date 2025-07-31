import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export const TermsOfService = () => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold">Terms of Service</h2>
    <p className="text-sm text-gray-600">Last Updated: January 31, 2025</p>
    
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-semibold mb-2">1. Service Description</h3>
        <p className="text-sm text-gray-700">
          My Pocket Sister provides AI-powered virtual companion services designed for young girls aged 10-14. 
          Our platform offers conversational AI, educational content, and emotional support through interactive chat experiences.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">2. Parental Consent and Account Creation</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>• Parents or legal guardians must create accounts for children under 13</p>
          <p>• Account holders must be at least 18 years old</p>
          <p>• Parents are responsible for monitoring their child's usage and interactions</p>
          <p>• Only one account per family is permitted</p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">3. Payment Terms</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>• Subscription fees are billed monthly in advance</p>
          <p>• All payments are processed securely through Stripe</p>
          <p>• Price changes will be communicated 30 days in advance</p>
          <p>• Usage is measured in tokens with monthly limits based on subscription tier</p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">4. Refund Policy</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>• 7-day money-back guarantee for new subscribers</p>
          <p>• Refunds processed within 5-7 business days</p>
          <p>• Partial refunds not available for unused tokens</p>
          <p>• Account cancellation takes effect at the end of current billing period</p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">5. Prohibited Use</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>• Sharing inappropriate, harmful, or offensive content</p>
          <p>• Attempting to extract personal information from the AI</p>
          <p>• Using the service for commercial purposes without permission</p>
          <p>• Circumventing usage limits or security measures</p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">6. Limitations of Liability</h3>
        <p className="text-sm text-gray-700">
          My Pocket Sister provides AI companions for entertainment and emotional support only. 
          Our service does not replace professional counseling, medical advice, or educational instruction. 
          We are not liable for decisions made based on AI responses.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">7. Service Termination</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>• We may terminate accounts for violations of these terms</p>
          <p>• Users may cancel subscriptions at any time</p>
          <p>• Data will be retained for 30 days after account closure</p>
          <p>• No refunds for partial billing periods upon termination</p>
        </div>
      </section>
    </div>
  </div>
);

export const PrivacyPolicy = () => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold">Privacy Policy</h2>
    <p className="text-sm text-gray-600">Last Updated: January 31, 2025</p>
    
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-semibold mb-2">1. Information We Collect</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p><strong>Account Information:</strong> Email, name, subscription details</p>
          <p><strong>Child Profile Data:</strong> Child's name, age, companion preferences</p>
          <p><strong>Conversation Data:</strong> Messages exchanged with AI companions</p>
          <p><strong>Usage Analytics:</strong> Token consumption, session duration, feature usage</p>
          <p><strong>Device Information:</strong> Browser type, device type for push notifications</p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">2. How We Use Your Information</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>• Provide personalized AI companion experiences</p>
          <p>• Monitor usage limits and send parental alerts</p>
          <p>• Improve our AI models and service quality</p>
          <p>• Process payments and manage subscriptions</p>
          <p>• Send important service updates and notifications</p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">3. Data Storage and Security</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>• All data is encrypted in transit and at rest</p>
          <p>• Hosted on secure cloud infrastructure with regular backups</p>
          <p>• Access limited to authorized personnel only</p>
          <p>• Regular security audits and monitoring</p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">4. Data Sharing</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p><strong>We NEVER sell your data to third parties</strong></p>
          <p>• Limited sharing with service providers (Stripe for payments, hosting providers)</p>
          <p>• Law enforcement only when legally required</p>
          <p>• Anonymized usage statistics for service improvement</p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">5. Parental Rights</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>• View all conversation history for your children</p>
          <p>• Request complete data deletion at any time</p>
          <p>• Modify privacy settings and usage limits</p>
          <p>• Export your child's data in portable format</p>
          <p>• Contact us at privacy@mypocketsister.com for data requests</p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">6. COPPA Compliance</h3>
        <p className="text-sm text-gray-700">
          We comply with the Children's Online Privacy Protection Act (COPPA). 
          Parental consent is required for all users under 13. 
          We do not knowingly collect personal information from children without verified parental consent.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">7. International Users</h3>
        <p className="text-sm text-gray-700">
          For users in the European Union, you have additional rights under GDPR including 
          data portability, right to be forgotten, and the right to restrict processing. 
          Contact our Data Protection Officer at dpo@mypocketsister.com.
        </p>
      </section>
    </div>
  </div>
);

export const ParentalConsentAgreement = () => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold">Parental Consent Agreement</h2>
    <p className="text-sm text-gray-600">Required for all users under 18</p>
    
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-semibold mb-2">Parental Acknowledgment</h3>
        <div className="text-sm text-gray-700 space-y-3">
          <p>By checking the consent box below, I acknowledge and agree that:</p>
          
          <div className="pl-4 space-y-2">
            <p>✓ I am the parent or legal guardian of the child who will use this service</p>
            <p>✓ I am at least 18 years old and legally able to enter into this agreement</p>
            <p>✓ I have read and understood the Terms of Service and Privacy Policy</p>
            <p>✓ I consent to my child using AI-powered chat services provided by My Pocket Sister</p>
            <p>✓ I understand this is an AI service and responses may not replace professional advice</p>
            <p>✓ I will monitor my child's usage and ensure appropriate interactions</p>
            <p>✓ I understand I can revoke this consent and delete all data at any time</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">Safety and Monitoring</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>• You can view all conversation history through the Parent Portal</p>
          <p>• Usage alerts will notify you when limits are approached</p>
          <p>• Emergency contact information is available for safety concerns</p>
          <p>• AI companions are designed for positive, supportive interactions only</p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">Contact Information</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>Questions about this service: support@mypocketsister.com</p>
          <p>Privacy concerns: privacy@mypocketsister.com</p>
          <p>Safety reports: safety@mypocketsister.com</p>
          <p>Emergency support: 24/7 through our parent portal</p>
        </div>
      </section>
    </div>
  </div>
);

export const CommunityGuidelines = () => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold">Community Guidelines</h2>
    <p className="text-sm text-gray-600">Creating safe, positive interactions</p>
    
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-semibold mb-2">Positive Interactions</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>• Be kind and respectful in all conversations</p>
          <p>• Use the AI companion for encouragement and support</p>
          <p>• Ask questions about learning, creativity, and personal growth</p>
          <p>• Share appropriate interests and hobbies</p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">Prohibited Content</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>• No harmful, threatening, or inappropriate language</p>
          <p>• No sharing of personal information (address, phone, school)</p>
          <p>• No attempts to roleplay inappropriate scenarios</p>
          <p>• No trying to "break" or confuse the AI companion</p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">Reporting and Safety</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>• Report any concerning AI responses to parents immediately</p>
          <p>• Parents can review all conversations through the Parent Portal</p>
          <p>• Emergency situations should be reported to trusted adults</p>
          <p>• Our AI is continuously monitored for safety</p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-2">Consequences</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>• First violation: Warning and parental notification</p>
          <p>• Repeated violations: Temporary account suspension</p>
          <p>• Serious violations: Permanent account termination</p>
          <p>• All violations are reported to parents/guardians</p>
        </div>
      </section>
    </div>
  </div>
);

interface LegalDocumentModalProps {
  document: "terms" | "privacy" | "consent" | "guidelines";
  isOpen: boolean;
  onClose: () => void;
}

export const LegalDocumentModal = ({ document, isOpen, onClose }: LegalDocumentModalProps) => {
  if (!isOpen) return null;

  const getDocumentContent = () => {
    switch (document) {
      case "terms":
        return <TermsOfService />;
      case "privacy":
        return <PrivacyPolicy />;
      case "consent":
        return <ParentalConsentAgreement />;
      case "guidelines":
        return <CommunityGuidelines />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle>Legal Document</CardTitle>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ×
            </button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            {getDocumentContent()}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};