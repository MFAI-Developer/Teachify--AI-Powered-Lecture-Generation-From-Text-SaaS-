const Terms = () => {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Agreement to Terms</h2>
            <p>
              By accessing or using Teachify, you agree to be bound by these Terms of Service and all
              applicable laws and regulations. If you do not agree with any of these terms, you are
              prohibited from using this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Use License</h2>
            <p>
              Permission is granted to temporarily access and use Teachify for personal or commercial
              educational purposes. This is the grant of a license, not a transfer of title.
            </p>
            <p>Under this license, you may not:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Modify or copy the service materials</li>
              <li>Use the materials for any commercial purpose outside of education</li>
              <li>Attempt to reverse engineer any software contained on the platform</li>
              <li>Remove any copyright or proprietary notations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">User Content</h2>
            <p>
              You retain all rights to content you create using Teachify. By using our service, you grant
              us a limited license to process and generate content based on your inputs.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Acceptable Use</h2>
            <p>You agree not to use Teachify to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Generate harmful, offensive, or illegal content</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Attempt to circumvent usage limitations</li>
              <li>Interfere with the service's security features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Service Modifications</h2>
            <p>
              We reserve the right to modify or discontinue the service at any time, with or without
              notice. We shall not be liable to you or any third party for any modification, suspension,
              or discontinuance of the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Limitation of Liability</h2>
            <p>
              Teachify shall not be liable for any indirect, incidental, special, consequential, or
              punitive damages resulting from your use or inability to use the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Contact</h2>
            <p>
              Questions about these Terms should be sent to{' '}
              <a href="mailto:legal@teachify.ai" className="text-primary hover:underline">
                legal@teachify.ai
              </a>
            </p>
          </section>

          <p className="text-sm pt-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
