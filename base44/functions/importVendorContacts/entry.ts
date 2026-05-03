import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all vendor contacts
    const contacts = await base44.asServiceRole.entities.Contact.filter({ type: 'vendor_contact' });
    
    if (contacts.length === 0) {
      return Response.json({ 
        success: true, 
        imported: 0, 
        message: 'No vendor contacts found' 
      });
    }

    // Get existing vendors to avoid duplicates
    const existingVendors = await base44.asServiceRole.entities.Vendor.list();
    const existingEmails = new Set(existingVendors.map(v => v.email?.toLowerCase()).filter(Boolean));

    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (const contact of contacts) {
      try {
        // Skip if email already exists as vendor
        if (contact.email && existingEmails.has(contact.email.toLowerCase())) {
          skipped++;
          continue;
        }

        // Map contact data to vendor
        const vendorData = {
          company_name: contact.company || contact.full_name,
          contact_name: contact.full_name,
          email: contact.email || '',
          phone: contact.phone || '',
          address: contact.address || '',
          city: contact.city || '',
          state: contact.state || '',
          zip: contact.zip || '',
          products_supplied: contact.vendor_products ? [contact.vendor_products] : [],
          notes: contact.notes || '',
          status: 'active'
        };

        await base44.asServiceRole.entities.Vendor.create(vendorData);
        imported++;
      } catch (error) {
        errors.push({ contact: contact.full_name, error: error.message });
      }
    }

    return Response.json({
      success: true,
      imported,
      skipped,
      total: contacts.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Import error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});