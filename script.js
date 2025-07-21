class ChargebeeAIAssistant {
    constructor() {
        this.isListening = false;
        this.recognition = null;
        // Remove hardcoded API key - we'll use our serverless function
        
        this.suggestions = [
            'What is Chargebee?',
            'Pricing plans',
            'How to integrate Chargebee?',
            'Subscription management features',
            'Payment gateway integrations',
            'Billing automation',
            'Customer portal features',
            'API documentation',
            'Free trial information',
            'Enterprise solutions'
        ];

        this.initializeElements();
        this.initializeSpeechRecognition();
        this.bindEvents();
    }

    initializeElements() {
        this.voiceBtn = document.getElementById('voiceAssistantBtn');
        this.modalOverlay = document.getElementById('modalOverlay');
        this.modal = document.getElementById('modal');
        this.closeBtn = document.getElementById('closeBtn');
        this.voiceVisualizer = document.getElementById('voiceVisualizer');
        this.voiceBtnModal = document.getElementById('voiceBtn');
        this.voiceStatus = document.getElementById('voiceStatus');
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.statusContainer = document.getElementById('statusContainer');
        this.resultsSection = document.getElementById('resultsSection');
        this.loadingDiv = document.getElementById('loadingDiv');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.suggestionsDiv = document.getElementById('suggestions');
    }

    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateVoiceUI();
                this.showStatus('Listening... Speak now!', 'listening');
            };

            this.recognition.onresult = (event) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                
                this.searchInput.value = transcript;
                
                if (event.results[event.results.length - 1].isFinal) {
                    this.stopListening();
                    this.correctAndSearch(transcript);
                }
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.stopListening();
                this.handleSpeechError(event.error);
            };

            this.recognition.onend = () => {
                this.stopListening();
            };
        } else {
            console.warn('Speech recognition not supported in this browser');
            this.voiceBtnModal.disabled = true;
            this.voiceStatus.textContent = 'Voice recognition not supported in this browser';
        }
    }

    bindEvents() {
        this.voiceBtn.addEventListener('click', () => this.openModal());
        this.closeBtn.addEventListener('click', () => this.closeModal());
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) this.closeModal();
        });

        this.voiceBtnModal.addEventListener('click', () => this.toggleListening());
        this.searchBtn.addEventListener('click', () => this.performSearch());
        
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });

        this.searchInput.addEventListener('input', (e) => {
            this.showSuggestions(e.target.value);
        });

        this.searchInput.addEventListener('focus', () => {
            if (this.searchInput.value) this.showSuggestions(this.searchInput.value);
        });

        document.addEventListener('click', (e) => {
            if (!this.searchInput.contains(e.target) && !this.suggestionsDiv.contains(e.target)) {
                this.hideSuggestions();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key === 'a') {
                e.preventDefault();
                this.openModal();
            }
            if (e.key === 'Escape' && this.modalOverlay.style.display === 'flex') {
                this.closeModal();
            }
        });
    }

    openModal() {
        this.modalOverlay.style.display = 'flex';
        setTimeout(() => {
            this.modal.classList.add('show');
        }, 10);
        this.searchInput.focus();
    }

    closeModal() {
        this.modal.classList.remove('show');
        setTimeout(() => {
            this.modalOverlay.style.display = 'none';
            this.resetModal();
        }, 300);
    }

    resetModal() {
        this.stopListening();
        this.searchInput.value = '';
        this.resultsSection.classList.remove('show');
        this.statusContainer.innerHTML = '';
        this.resultsContainer.innerHTML = '';
        this.hideSuggestions();
    }

    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    async startListening() {
        try {
            await this.checkMicrophonePermission();
            
            if (this.recognition) {
                this.recognition.start();
                this.voiceBtn.classList.add('listening');
            }
        } catch (error) {
            console.error('Microphone permission error:', error);
            this.handleMicrophonePermissionError();
        }
    }

    async checkMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });
            
            stream.getTracks().forEach(track => track.stop());
            return true;
            
        } catch (error) {
            console.log('getUserMedia error:', error.name, error.message);
            
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                throw new Error('Microphone access denied by user');
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                throw new Error('No microphone device found');
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                throw new Error('Microphone is being used by another application');
            } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
                try {
                    const simpleStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    simpleStream.getTracks().forEach(track => track.stop());
                    return true;
                } catch (simpleError) {
                    throw new Error('Microphone constraints not supported');
                }
            } else {
                throw error;
            }
        }
    }

    handleMicrophonePermissionError() {
        this.showStatus('Microphone access needed for voice search. Please allow microphone permission.', 'error');
        
        setTimeout(() => {
            const permissionModal = this.createPermissionModal();
            document.body.appendChild(permissionModal);
        }, 1500);
    }

    createPermissionModal() {
        const permissionOverlay = document.createElement('div');
        permissionOverlay.className = 'permission-modal-overlay';
        permissionOverlay.innerHTML = `
            <div class="permission-modal">
                <div class="permission-modal-header">
                    <h3>🎤 Microphone Permission Required</h3>
                </div>
                <div class="permission-modal-content">
                    <p>To use voice search, please allow microphone access:</p>
                    <div class="permission-steps">
                        <div class="permission-step">
                            <strong>Chrome/Edge:</strong> Click the 🎤 icon in the address bar and select "Always allow"
                        </div>
                        <div class="permission-step">
                            <strong>Safari:</strong> Go to Safari menu → Settings → Websites → Microphone → Allow
                        </div>
                        <div class="permission-step">
                            <strong>Firefox:</strong> Click the 🎤 icon next to the address bar and select "Allow"
                        </div>
                    </div>
                    <p><strong>Alternative:</strong> You can also type your question in the text box.</p>
                    <div class="permission-buttons">
                        <button class="permission-btn permission-btn-primary" id="retryPermission">Try Again</button>
                        <button class="permission-btn permission-btn-secondary" id="useTextInput">Use Text Input</button>
                    </div>
                </div>
            </div>
        `;

        setTimeout(() => {
            const retryBtn = permissionOverlay.querySelector('#retryPermission');
            const textBtn = permissionOverlay.querySelector('#useTextInput');

            retryBtn.addEventListener('click', async () => {
                permissionOverlay.remove();
                await this.startListening();
            });

            textBtn.addEventListener('click', () => {
                permissionOverlay.remove();
                this.searchInput.focus();
                this.showStatus('You can type your question below', 'listening');
            });
        }, 100);

        return permissionOverlay;
    }

    handleSpeechError(error) {
        let message = '';
        let type = 'error';

        switch (error) {
            case 'not-allowed':
            case 'permission-denied':
                this.handleMicrophonePermissionError();
                return;
            case 'no-speech':
                message = 'No speech detected. Please try again.';
                type = 'error';
                break;
            case 'audio-capture':
                message = 'Microphone not available. Please check your device settings.';
                type = 'error';
                break;
            case 'network':
                message = 'Network error. Please check your internet connection.';
                type = 'error';
                break;
            case 'aborted':
                message = 'Voice recognition was stopped.';
                type = 'processing';
                break;
            default:
                message = 'Voice recognition error. Please try typing instead.';
                type = 'error';
        }

        this.showStatus(message, type);
    }

    stopListening() {
        if (this.recognition) {
            this.recognition.stop();
        }
        this.isListening = false;
        this.updateVoiceUI();
        this.voiceBtn.classList.remove('listening');
    }

    updateVoiceUI() {
        if (this.isListening) {
            this.voiceVisualizer.classList.add('active');
            this.voiceBtnModal.classList.add('listening');
            this.voiceStatus.textContent = 'Listening... Speak now!';
        } else {
            this.voiceVisualizer.classList.remove('active');
            this.voiceBtnModal.classList.remove('listening');
            this.voiceStatus.textContent = 'Click the microphone to start speaking';
        }
    }

    showSuggestions(query) {
        if (!query.trim()) {
            this.hideSuggestions();
            return;
        }

        const filteredSuggestions = this.suggestions.filter(suggestion =>
            suggestion.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);

        if (filteredSuggestions.length > 0) {
            this.suggestionsDiv.innerHTML = filteredSuggestions
                .map(suggestion => `<div class="suggestion-item">${suggestion}</div>`)
                .join('');
            
            this.suggestionsDiv.style.display = 'block';

            this.suggestionsDiv.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.searchInput.value = item.textContent;
                    this.hideSuggestions();
                    this.performSearch();
                });
            });
        } else {
            this.hideSuggestions();
        }
    }

    hideSuggestions() {
        this.suggestionsDiv.style.display = 'none';
    }

    showStatus(message, type) {
        const statusDiv = document.createElement('div');
        statusDiv.className = `status-message status-${type}`;
        statusDiv.textContent = message;
        this.statusContainer.innerHTML = '';
        this.statusContainer.appendChild(statusDiv);

        if (type !== 'error') {
            setTimeout(() => {
                statusDiv.remove();
            }, 3000);
        }
    }

    async correctAndSearch(text) {
        this.showStatus('Processing and correcting text...', 'processing');
        
        try {
            const correctedText = await this.correctText(text);
            this.searchInput.value = correctedText;
            await this.performSearch();
        } catch (error) {
            console.error('Text correction error:', error);
            await this.performSearch();
        }
    }

    async correctText(text) {
        // For SearchAPI, we'll use basic text correction since we don't have AI correction
        return this.basicTextCorrection(text);
    }

    basicTextCorrection(text) {
        let corrected = text.trim();
        
        const corrections = {
            'charge be': 'chargebee',
            'charge bee': 'chargebee',
            'pricing': 'pricing plans',
            'how much': 'what is the pricing for',
            'tell me about': 'what is',
            'whats': 'what is',
            'hows': 'how does',
            'cant': 'cannot',
            'wont': 'will not',
            'dont': 'do not',
            'isnt': 'is not',
            'arent': 'are not'
        };

        Object.keys(corrections).forEach(wrong => {
            const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
            corrected = corrected.replace(regex, corrections[wrong]);
        });

        const questionWords = ['what', 'how', 'when', 'where', 'why', 'who', 'which', 'can', 'do', 'does', 'is', 'are'];
        const startsWithQuestion = questionWords.some(word => 
            corrected.toLowerCase().startsWith(word.toLowerCase())
        );
        
        if (startsWithQuestion && !corrected.endsWith('?')) {
            corrected += '?';
        }

        return corrected;
    }

    async performSearch() {
        const query = this.searchInput.value.trim();
        if (!query) {
            this.showStatus('Please enter a question first.', 'error');
            return;
        }

        // Check if query is Chargebee-related
        if (!this.isChargebeeRelated(query)) {
            this.showStatus('I can only help with questions about Chargebee. Please ask something related to Chargebee subscription management, billing, pricing, features, integrations, etc.', 'error');
            return;
        }

        this.hideSuggestions();
        this.resultsSection.classList.add('show');
        this.loadingDiv.style.display = 'block';
        this.resultsContainer.innerHTML = '';
        this.searchBtn.disabled = true;
        
        this.showStatus('Searching for information about Chargebee...', 'processing');

        try {
            const searchResults = await this.searchChargebeeInfo(query);
            const aiResponseData = await this.getAIResponse(query, searchResults);
            this.displayResults(aiResponseData, query);
        } catch (error) {
            console.error('Search error:', error);
            this.showStatus('Search failed. Please try again.', 'error');
        } finally {
            this.loadingDiv.style.display = 'none';
            this.searchBtn.disabled = false;
        }
    }

    async searchChargebeeInfo(query) {
        const chargebeeInfo = {
            'pricing': 'Chargebee offers flexible pricing plans starting from $99/month for growing businesses.',
            'features': 'Key features include subscription management, automated billing, payment processing, customer portal, analytics, and integrations.',
            'integration': 'Chargebee integrates with 100+ apps including Salesforce, HubSpot, Slack, and major payment gateways.',
            'api': 'Chargebee provides comprehensive REST APIs and SDKs for multiple programming languages.',
            'trial': 'Chargebee offers a 14-day free trial with no credit card required.',
            'support': '24/7 customer support available via chat, email, and phone for all paid plans.'
        };

        let relevantInfo = '';
        Object.keys(chargebeeInfo).forEach(key => {
            if (query.toLowerCase().includes(key)) {
                relevantInfo += chargebeeInfo[key] + ' ';
            }
        });

        return relevantInfo || 'General information about Chargebee subscription management platform.';
    }

    async getAIResponse(query, context) {
        try {
            const response = await fetch('/api/openai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                    location: 'United States'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error.message);
            }

            return {
                content: data.choices[0].message.content.trim(),
                relevantLink: data.relevant_link || null
            };
        } catch (error) {
            console.error('SearchAPI error:', error);
            return {
                content: this.getFallbackResponse(query, context),
                relevantLink: null
            };
        }
    }

    getFallbackResponse(query, context) {
        const queryLower = query.toLowerCase();
        
        const fallbackResponses = {
            pricing: "Chargebee offers flexible pricing plans starting from $99/month for the Launch plan (up to $100K ARR), $249/month for Scale (up to $1M ARR), and custom pricing for Rise (enterprise). All plans include a 14-day free trial with no setup fees.",
            
            features: "Chargebee provides comprehensive subscription management including automated billing, dunning management, revenue recognition, customer portal, analytics & reporting, tax compliance, payment processing, and integrations with 100+ business tools.",
            
            integration: "Chargebee seamlessly integrates with popular tools like Salesforce, HubSpot, Slack, QuickBooks, Xero, Stripe, PayPal, Razorpay, and many more. It also provides REST APIs and webhooks for custom integrations.",
            
            api: "Chargebee offers comprehensive REST APIs with SDKs available for PHP, Ruby, Python, Node.js, Java, .NET, and Go. The API supports all subscription management operations including customer creation, subscription lifecycle, billing, and reporting.",
            
            trial: "Yes! Chargebee offers a 14-day free trial with no credit card required. You get full access to all features during the trial period to test the platform thoroughly.",
            
            support: "Chargebee provides 24/7 customer support via chat, email, and phone for all paid plans. They also offer implementation assistance, migration support, and dedicated customer success managers for enterprise clients.",
            
            security: "Chargebee is SOC 2 Type II certified, PCI DSS Level 1 compliant, and follows industry-standard security practices. All data is encrypted in transit and at rest, with regular security audits and compliance certifications.",
            
            migration: "Chargebee offers free migration assistance to help you move from your current billing system. Their migration team provides data mapping, testing support, and ensures zero disruption to your business operations."
        };

        let bestMatch = '';
        let maxMatches = 0;

        Object.keys(fallbackResponses).forEach(key => {
            const matches = (queryLower.match(new RegExp(key, 'g')) || []).length +
                          (queryLower.includes(key) ? 1 : 0);
            
            if (matches > maxMatches) {
                maxMatches = matches;
                bestMatch = key;
            }
        });

        if (bestMatch && maxMatches > 0) {
            return fallbackResponses[bestMatch];
        }

        return `Based on your question about "${query}", here's what I can tell you about Chargebee:

Chargebee is a comprehensive subscription billing and revenue operations platform that helps businesses automate their recurring billing, manage subscriptions, and optimize revenue operations. 

Key capabilities include:
• Automated subscription billing and invoicing
• Revenue recognition and analytics
• Customer lifecycle management
• Payment processing with multiple gateways
• Tax compliance and dunning management
• 100+ integrations with popular business tools

For specific information about your question, I recommend visiting chargebee.com or contacting their support team for detailed assistance.`;
    }

    getTargetedChargebeeLink(query) {
        const queryLower = query.toLowerCase();
        
        const linkMappings = {
            pricing: 'https://www.chargebee.com/pricing/',
            'free trial': 'https://www.chargebee.com/trial/',
            trial: 'https://www.chargebee.com/trial/',
            features: 'https://www.chargebee.com/features/',
            integration: 'https://www.chargebee.com/integrations/',
            integrations: 'https://www.chargebee.com/integrations/',
            api: 'https://www.chargebee.com/docs/api/',
            'api documentation': 'https://www.chargebee.com/docs/api/',
            documentation: 'https://www.chargebee.com/docs/',
            docs: 'https://www.chargebee.com/docs/',
            support: 'https://www.chargebee.com/contact/',
            contact: 'https://www.chargebee.com/contact/',
            security: 'https://www.chargebee.com/security/',
            compliance: 'https://www.chargebee.com/security/',
            migration: 'https://www.chargebee.com/migration/',
            migrate: 'https://www.chargebee.com/migration/',
            billing: 'https://www.chargebee.com/recurring-billing-software/',
            'subscription management': 'https://www.chargebee.com/subscription-management/',
            subscription: 'https://www.chargebee.com/subscription-management/',
            analytics: 'https://www.chargebee.com/subscription-analytics/',
            reporting: 'https://www.chargebee.com/subscription-analytics/',
            revenue: 'https://www.chargebee.com/revenue-recognition/',
            'revenue recognition': 'https://www.chargebee.com/revenue-recognition/',
            dunning: 'https://www.chargebee.com/dunning-management/',
            'dunning management': 'https://www.chargebee.com/dunning-management/',
            tax: 'https://www.chargebee.com/tax-management/',
            taxes: 'https://www.chargebee.com/tax-management/',
            'payment gateway': 'https://www.chargebee.com/payment-gateways/',
            payments: 'https://www.chargebee.com/payment-gateways/',
            gateway: 'https://www.chargebee.com/payment-gateways/',
            stripe: 'https://www.chargebee.com/integrations/stripe/',
            paypal: 'https://www.chargebee.com/integrations/paypal/',
            salesforce: 'https://www.chargebee.com/integrations/salesforce/',
            hubspot: 'https://www.chargebee.com/integrations/hubspot/',
            quickbooks: 'https://www.chargebee.com/integrations/quickbooks/',
            slack: 'https://www.chargebee.com/integrations/slack/',
            'customer portal': 'https://www.chargebee.com/customer-portal/',
            portal: 'https://www.chargebee.com/customer-portal/',
            invoice: 'https://www.chargebee.com/recurring-billing-software/',
            invoicing: 'https://www.chargebee.com/recurring-billing-software/',
            webhook: 'https://www.chargebee.com/docs/webhooks.html',
            webhooks: 'https://www.chargebee.com/docs/webhooks.html',
            demo: 'https://www.chargebee.com/schedule-a-demo/',
            'schedule demo': 'https://www.chargebee.com/schedule-a-demo/',
            'book demo': 'https://www.chargebee.com/schedule-a-demo/',
        };

        // Find the best matching link
        for (const [keyword, url] of Object.entries(linkMappings)) {
            if (queryLower.includes(keyword)) {
                return url;
            }
        }

        // If no specific match, return the main Chargebee website
        return 'https://www.chargebee.com/';
    }

    displayResults(aiResponseData, query) {
        this.statusContainer.innerHTML = '';
        
        const resultCard = document.createElement('div');
        resultCard.className = 'result-card';
        
        // Use the relevant link from SearchAPI if available, otherwise fall back to keyword-based mapping
        const targetedLink = aiResponseData.relevantLink || this.getTargetedChargebeeLink(query);
        
        resultCard.innerHTML = `
            <div class="result-title">AI Assistant Response</div>
            <div class="result-content">${aiResponseData.content}</div>
            <a href="${targetedLink}" 
               target="_blank" 
               class="learn-more-btn">
               Learn More on Chargebee →
            </a>
        `;

        this.resultsContainer.appendChild(resultCard);

        // Add contextual helpful resources
        const contextualLinks = this.getContextualResources(query);
        const linksCard = document.createElement('div');
        linksCard.className = 'result-card';
        linksCard.innerHTML = `
            <div class="result-title">Helpful Resources</div>
            <div class="result-content">
                ${contextualLinks.map(link => 
                    `<a href="${link.url}" target="_blank" class="learn-more-btn" style="margin-right: 10px; margin-bottom: 10px;">${link.text}</a>`
                ).join('')}
            </div>
        `;
        
        this.resultsContainer.appendChild(linksCard);
    }

    getContextualResources(query) {
        const queryLower = query.toLowerCase();
        const defaultLinks = [
            { text: 'Start Free Trial', url: 'https://www.chargebee.com/trial/' },
            { text: 'Documentation', url: 'https://www.chargebee.com/docs/' },
            { text: 'Contact Support', url: 'https://www.chargebee.com/contact/' }
        ];

        // Add context-specific resources based on query
        if (queryLower.includes('pricing') || queryLower.includes('cost') || queryLower.includes('price')) {
            return [
                { text: 'View Pricing Plans', url: 'https://www.chargebee.com/pricing/' },
                { text: 'Start Free Trial', url: 'https://www.chargebee.com/trial/' },
                { text: 'Schedule Demo', url: 'https://www.chargebee.com/schedule-a-demo/' }
            ];
        } else if (queryLower.includes('integration') || queryLower.includes('api') || queryLower.includes('webhook')) {
            return [
                { text: 'API Documentation', url: 'https://www.chargebee.com/docs/api/' },
                { text: 'View Integrations', url: 'https://www.chargebee.com/integrations/' },
                { text: 'Developer Resources', url: 'https://www.chargebee.com/docs/' }
            ];
        } else if (queryLower.includes('security') || queryLower.includes('compliance')) {
            return [
                { text: 'Security Overview', url: 'https://www.chargebee.com/security/' },
                { text: 'Compliance Details', url: 'https://www.chargebee.com/security/' },
                { text: 'Contact Support', url: 'https://www.chargebee.com/contact/' }
            ];
        } else if (queryLower.includes('migration') || queryLower.includes('migrate')) {
            return [
                { text: 'Migration Guide', url: 'https://www.chargebee.com/migration/' },
                { text: 'Contact Migration Team', url: 'https://www.chargebee.com/contact/' },
                { text: 'Schedule Demo', url: 'https://www.chargebee.com/schedule-a-demo/' }
            ];
        }

        return defaultLinks;
    }

    isChargebeeRelated(query) {
        const queryLower = query.toLowerCase();
        
        // Direct Chargebee mentions
        if (queryLower.includes('chargebee') || queryLower.includes('charge bee')) {
            return true;
        }
        
        // Subscription billing and management related terms
        const chargebeeTerms = [
            // Core business terms
            'subscription', 'billing', 'invoice', 'invoicing', 'recurring', 'payment', 'revenue',
            'dunning', 'trial', 'pricing', 'plan', 'customer portal', 'subscription management',
            'recurring billing', 'subscription billing', 'revenue recognition', 'saas billing',
            
            // Payment and gateway terms
            'payment gateway', 'stripe', 'paypal', 'razorpay', 'gateway integration',
            'payment processing', 'credit card', 'payment method',
            
            // Integration and API terms
            'api', 'webhook', 'integration', 'salesforce', 'hubspot', 'quickbooks', 'slack',
            'xero', 'integration with', 'rest api', 'sdk',
            
            // Business process terms
            'tax management', 'tax compliance', 'dunning management', 'customer lifecycle',
            'subscription analytics', 'revenue analytics', 'mrr', 'arr', 'churn',
            'customer retention', 'subscription metrics',
            
            // Support and migration terms
            'migration', 'migrate from', 'customer support', 'implementation',
            'onboarding', 'setup', 'configuration',
            
            // Security and compliance
            'security', 'compliance', 'pci dss', 'soc 2', 'data protection',
            'encryption', 'audit',
            
            // Features and capabilities
            'automated billing', 'proration', 'metered billing', 'usage based billing',
            'tiered pricing', 'add-ons', 'coupons', 'discounts', 'subscription lifecycle'
        ];
        
        // Check if query contains any Chargebee-related terms
        const hasChargebeeTerms = chargebeeTerms.some(term => queryLower.includes(term));
        
        // Additional context-based checks
        const businessQuestions = [
            'how to', 'what is', 'how does', 'can i', 'do you', 'does it', 'is there',
            'how much', 'pricing', 'cost', 'free trial', 'demo', 'features', 'capabilities'
        ];
        
        const startsWithBusinessQuestion = businessQuestions.some(question => 
            queryLower.startsWith(question)
        );
        
        // If it starts with a business question and has Chargebee terms, it's likely related
        if (startsWithBusinessQuestion && hasChargebeeTerms) {
            return true;
        }
        
        // Direct feature/service queries that could be Chargebee related
        if (hasChargebeeTerms) {
            return true;
        }
        
        return false;
    }
}

// Initialize the AI Assistant when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChargebeeAIAssistant();
});
