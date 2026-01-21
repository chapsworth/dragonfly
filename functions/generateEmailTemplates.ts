import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if templates already exist
    const existingTemplates = await base44.entities.EmailTemplate.list();
    if (existingTemplates.length > 0) {
      return Response.json({ 
        success: true, 
        message: 'Templates already exist',
        count: existingTemplates.length 
      });
    }

    // Generate email templates using AI
    const templatePrompts = [
      {
        category: 'outreach',
        prompt: 'Create a professional cold outreach email template for contacting new potential cannabis business partners or clients'
      },
      {
        category: 'orders',
        prompt: 'Create an order confirmation email template for cannabis delivery orders with tracking details'
      },
      {
        category: 'deals',
        prompt: 'Create a follow-up email template for checking in on a business deal or proposal in the cannabis industry'
      },
      {
        category: 'holidays',
        prompt: 'Create a holiday promotional email template for cannabis products (4/20 themed)'
      },
      {
        category: 'follow_up',
        prompt: 'Create a gentle follow-up email template for reaching out to contacts who haven\'t responded'
      },
      {
        category: 'general',
        prompt: 'Create a thank you email template for new customers or clients in the cannabis business'
      },
      {
        category: 'outreach',
        prompt: 'Create a re-engagement email template for inactive contacts or customers'
      },
      {
        category: 'orders',
        prompt: 'Create a delivery update email template for cannabis orders that are out for delivery'
      },
      {
        category: 'deals',
        prompt: 'Create a deal closed/won celebration email template for successful partnerships'
      },
      {
        category: 'follow_up',
        prompt: 'Create a post-purchase follow-up email template asking for feedback'
      }
    ];

    const createdTemplates = [];

    for (const { category, prompt } of templatePrompts) {
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `${prompt}\n\nReturn JSON with "name", "subject", and "body" fields. The body should be professional HTML with proper formatting. Keep it concise and effective. Name should be short and descriptive.`,
          response_json_schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              subject: { type: "string" },
              body: { type: "string" }
            }
          }
        });

        const template = await base44.entities.EmailTemplate.create({
          name: result.name,
          category: category,
          subject: result.subject,
          body: result.body,
          is_active: true
        });

        createdTemplates.push(template);
      } catch (error) {
        console.error(`Failed to create template for ${category}:`, error);
      }
    }

    return Response.json({
      success: true,
      message: `Created ${createdTemplates.length} email templates`,
      templates: createdTemplates
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});