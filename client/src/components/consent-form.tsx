import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { LegalDocumentModal } from "./legal-documents";
import { Shield, FileText, Users, AlertTriangle } from "lucide-react";

interface ConsentFormProps {
  onConsentComplete: (consents: {
    termsAccepted: boolean;
    privacyAccepted: boolean;
    parentalConsent: boolean;
    communityGuidelines: boolean;
    isOver18: boolean;
    marketingEmails: boolean;
  }) => void;
  isLoading?: boolean;
}

export default function ConsentForm({ onConsentComplete, isLoading = false }: ConsentFormProps) {
  const [consents, setConsents] = useState({
    termsAccepted: false,
    privacyAccepted: false,
    parentalConsent: false,
    communityGuidelines: false,
    isOver18: false,
    marketingEmails: false,
  });
  
  const [openDocument, setOpenDocument] = useState<"terms" | "privacy" | "consent" | "guidelines" | null>(null);

  const handleConsentChange = (key: keyof typeof consents, value: boolean) => {
    setConsents(prev => ({ ...prev, [key]: value }));
  };

  const canProceed = consents.termsAccepted && 
                     consents.privacyAccepted && 
                     consents.parentalConsent && 
                     consents.communityGuidelines && 
                     consents.isOver18;

  const handleSubmit = () => {
    if (canProceed) {
      onConsentComplete(consents);
    }
  };

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-purple-600" />
            <CardTitle className="text-2xl">Legal Agreements</CardTitle>
          </div>
          <CardDescription>
            Please review and accept these documents to create your account
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Age Verification */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold">Age Verification</h3>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="age-verification"
                checked={consents.isOver18}
                onCheckedChange={(checked) => handleConsentChange('isOver18', !!checked)}
              />
              <Label htmlFor="age-verification" className="text-sm">
                I confirm that I am at least 18 years old and legally able to enter into this agreement
              </Label>
            </div>
          </div>

          <Separator />

          {/* Legal Documents */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Required Legal Documents</h3>
            </div>

            {/* Terms of Service */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={consents.termsAccepted}
                onCheckedChange={(checked) => handleConsentChange('termsAccepted', !!checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="terms" className="text-sm cursor-pointer">
                  I have read and agree to the{" "}
                  <button
                    type="button"
                    onClick={() => setOpenDocument("terms")}
                    className="text-purple-600 hover:underline font-medium"
                  >
                    Terms of Service
                  </button>
                </Label>
                <p className="text-xs text-gray-600 mt-1">
                  Covers payment terms, refund policy, and service limitations
                </p>
              </div>
            </div>

            {/* Privacy Policy */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="privacy"
                checked={consents.privacyAccepted}
                onCheckedChange={(checked) => handleConsentChange('privacyAccepted', !!checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="privacy" className="text-sm cursor-pointer">
                  I have read and agree to the{" "}
                  <button
                    type="button"
                    onClick={() => setOpenDocument("privacy")}
                    className="text-purple-600 hover:underline font-medium"
                  >
                    Privacy Policy
                  </button>
                </Label>
                <p className="text-xs text-gray-600 mt-1">
                  Explains data collection, storage, and your parental rights
                </p>
              </div>
            </div>

            {/* Parental Consent */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="parental-consent"
                checked={consents.parentalConsent}
                onCheckedChange={(checked) => handleConsentChange('parentalConsent', !!checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="parental-consent" className="text-sm cursor-pointer">
                  I provide{" "}
                  <button
                    type="button"
                    onClick={() => setOpenDocument("consent")}
                    className="text-purple-600 hover:underline font-medium"
                  >
                    Parental Consent
                  </button>
                  {" "}for my child to use this AI service
                </Label>
                <p className="text-xs text-gray-600 mt-1">
                  Required for children under 18 - includes safety guidelines
                </p>
              </div>
            </div>

            {/* Community Guidelines */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="guidelines"
                checked={consents.communityGuidelines}
                onCheckedChange={(checked) => handleConsentChange('communityGuidelines', !!checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="guidelines" className="text-sm cursor-pointer">
                  I agree to follow the{" "}
                  <button
                    type="button"
                    onClick={() => setOpenDocument("guidelines")}
                    className="text-purple-600 hover:underline font-medium"
                  >
                    Community Guidelines
                  </button>
                </Label>
                <p className="text-xs text-gray-600 mt-1">
                  Rules for safe, positive interactions with AI companions
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Optional Marketing */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">Optional Communications</h3>
            </div>
            <div className="flex items-start space-x-2">
              <Checkbox
                id="marketing"
                checked={consents.marketingEmails}
                onCheckedChange={(checked) => handleConsentChange('marketingEmails', !!checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="marketing" className="text-sm cursor-pointer">
                  I would like to receive updates about new features and parenting tips
                </Label>
                <p className="text-xs text-gray-600 mt-1">
                  You can unsubscribe at any time. Only relevant, helpful content.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!canProceed || isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Creating Account...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Complete Registration
                </>
              )}
            </Button>
            
            {!canProceed && (
              <p className="text-sm text-gray-600 text-center mt-2">
                Please accept all required agreements to continue
              </p>
            )}
          </div>

          {/* Legal Notice */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              By creating an account, you acknowledge that this is an AI service for entertainment 
              and emotional support only. It does not replace professional counseling, medical advice, 
              or educational instruction. You retain the right to delete all data at any time.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Document Modals */}
      <LegalDocumentModal
        document={openDocument!}
        isOpen={!!openDocument}
        onClose={() => setOpenDocument(null)}
      />
    </>
  );
}