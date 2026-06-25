import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.VERTEX_AI_API_KEY;
const project = process.env.GOOGLE_CLOUD_PROJECT;
const location = process.env.GOOGLE_CLOUD_LOCATION;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mode, prompt, context, explain, code, instructions } = body;

    const isVertex = !!project;
    const hasApiKey = !!apiKey;

    // Fallback to high-quality mockup responses if no AI configuration is available
    if (!isVertex && !hasApiKey) {
      return Response.json(getMockResponse(mode, body));
    }

    const ai = isVertex
      ? new GoogleGenAI({
          vertexai: true,
          project,
          location: location || 'us-east4',
        })
      : new GoogleGenAI({ apiKey });

    if (mode === 'generate') {
      const systemInstruction = `You are a strict, world-class Apache FreeMarker compiler and Email Developer assistant. Your sole job is to translate natural language instructions into clean, valid, production-ready FreeMarker logic optimized for HTML emails. 
- Always default to safe null-handling using the \`!\` operator or \`?has_content\` built-ins.
- Ensure all conditional tags (\`<#if>\`) and list tags (\`<#list>\`) are properly closed.
- Account for parent objects being null or undefined. When evaluating nested paths (e.g., \`user.name\`), wrap the entire path in parentheses before applying the fallback operator (e.g., \`(user.name)!"Valued Customer"\` or \`(user.premium)!false\`) to ensure the template does not crash if the parent object (\`user\`) itself is missing or undefined.
- For HTML layout and component structures, ALWAYS use table formats (<table>, <tr>, <td>) instead of block layout tags (like <div>). HTML emails require strict table-based structures for cross-client compatibility.
- Do not output any conversational filler, introductory markdown text, or explanations unless explicitly requested via the explanation parameter.
- Return a JSON object matching the JSON schema below. DO NOT wrap the JSON in markdown code blocks.`;

      const contents = `Generate FreeMarker logic for the following request:
Request: "${prompt}"
${context ? `Sample JSON Context to map variables from: ${JSON.stringify(context, null, 2)}` : ''}
${explain ? 'Include a detailed step-by-step breakdown of the tags in the explanation field.' : 'Do not provide an explanation (keep the explanation field empty).'}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              code: { type: 'STRING', description: 'The generated valid FreeMarker code block.' },
              explanation: { type: 'STRING', description: 'Step-by-step breakdown of the generated tags and null-handling. Empty if not requested.' }
            },
            required: ['code']
          }
        }
      });

      const responseText = response.text || '';
      return new Response(responseText, { headers: { 'Content-Type': 'application/json' } });

    } else if (mode === 'modify') {
      const systemInstruction = `You are a strict, world-class Apache FreeMarker compiler and Email Developer assistant. Your sole job is to modify the provided FreeMarker code according to the user's instructions.
- Maintain the existing logic and structures except where requested to modify.
- Always default to safe null-handling using the \`!\` operator or \`?has_content\` built-ins.
- Ensure all conditional tags (\`<#if>\`) and list tags (\`<#list>\`) are properly closed.
- Account for parent objects being null or undefined. When evaluating nested paths (e.g., \`user.name\`), wrap the entire path in parentheses before applying the fallback operator (e.g., \`(user.name)!"Valued Customer"\` or \`(user.premium)!false\`) to ensure the template does not crash if the parent object (\`user\`) itself is missing or undefined.
- For HTML layout and component structures, ALWAYS use table formats (<table>, <tr>, <td>) instead of block layout tags (like <div>). HTML emails require strict table-based structures for cross-client compatibility.
- Do not output conversational filler.
- Return a JSON object matching the JSON schema below. DO NOT wrap the JSON in markdown code blocks.`;

      const contents = `Modify the following FreeMarker code:
\`\`\`
${code}
\`\`\`
Instructions: "${instructions}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              code: { type: 'STRING', description: 'The modified FreeMarker code.' }
            },
            required: ['code']
          }
        }
      });

      const responseText = response.text || '';
      return new Response(responseText, { headers: { 'Content-Type': 'application/json' } });

    } else if (mode === 'audit') {
      const systemInstruction = `You are a strict, world-class Apache FreeMarker compiler, auditor, and Email Developer assistant. Your job is to audit the provided FreeMarker code for syntax errors, missing closing tags (like \`</#if>\` or \`</#list>\`), missing null-safe fallback indicators (\`!\`), performance bottlenecks, and compliance with email development best practices.
- Output a JSON object matching the JSON schema below. DO NOT wrap the JSON in markdown code blocks.`;

      const contents = `Audit the following FreeMarker code:
\`\`\`
${code}
\`\`\``;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              isValid: { type: 'BOOLEAN', description: 'True if code contains no issues or warnings. False if issues or warnings are present.' },
              issues: {
                type: 'ARRAY',
                description: 'List of syntax, null-safety, performance, or best practice issues found in the code.',
                items: {
                  type: 'OBJECT',
                  properties: {
                    severity: { type: 'STRING', enum: ['error', 'warning', 'info'] },
                    line: { type: 'INTEGER', description: 'Line number where the issue occurs, if detectable.' },
                    message: { type: 'STRING', description: 'Detailed description of the issue.' },
                    suggestion: { type: 'STRING', description: 'Recommended code fix or practice.' }
                  },
                  required: ['severity', 'message', 'suggestion']
                }
              }
            },
            required: ['isValid', 'issues']
          }
        }
      });

      const responseText = response.text || '';
      return new Response(responseText, { headers: { 'Content-Type': 'application/json' } });
    }

    return Response.json({ error: 'Invalid mode' }, { status: 400 });

  } catch (error: unknown) {
    console.error('API Route Error:', error);
    const message = error instanceof Error ? error.message : 'An error occurred during generation';
    return Response.json({ 
      error: message, 
      isError: true 
    }, { status: 500 });
  }
}

interface GenerateRequestBody {
  prompt?: string;
  context?: Record<string, unknown> | null;
  explain?: boolean;
  sourceLanguage?: 'liquid' | 'ampscript' | 'handlebars';
  sourceCode?: string;
  code?: string;
  instructions?: string;
}

function getMockResponse(mode: string, body: GenerateRequestBody) {
  if (mode === 'generate') {
    const promptLower = (body.prompt || '').toLowerCase();
    let generatedCode = '';
    let explanation = '';

    if (promptLower.includes('premium') || promptLower.includes('banner')) {
      generatedCode = `<#-- Check user subscription and status with parent-level null-safety check -->
<#if ((user.premium)!false) && ((user.status)!"") == "active">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" class="premium-banner">
    <tr>
      <td style="padding: 20px; background-color: #000000; color: #ffffff;">
        Welcome back, \${(user.name)!"Valued Customer"}! Thanks for being a premium subscriber.
      </td>
    </tr>
  </table>
<#else>
  <table border="0" cellpadding="0" cellspacing="0" width="100%" class="standard-banner">
    <tr>
      <td style="padding: 20px; border: 1px solid #e4e4e7; background-color: #ffffff; color: #111111;">
        Upgrade to premium to unlock exclusive features!
      </td>
    </tr>
  </table>
</#if>`;
      explanation = `1. **Parent-Level Null-Safe Check**: Wrapping parent paths in parentheses like \`((user.premium)!false)\` and \`((user.status)!"")\` ensures the template does not crash even if the \`user\` object itself is missing or null.
2. **Conditional Check**: The \`<#if>\` tag validates if the boolean is true AND status is "active".
3. **Fallback Interpolation**: \`\${(user.name)!"Valued Customer"}\` outputs the user name, safely fallbacking to "Valued Customer" if \`user\` or \`user.name\` is undefined.`;
    } else if (promptLower.includes('loop') || promptLower.includes('list') || promptLower.includes('product') || promptLower.includes('each')) {
      generatedCode = `<#-- Iterate through the products list if it contains items -->
<#if products?has_content>
  <table class="product-grid" border="0" cellpadding="10" cellspacing="0">
    <thead>
      <tr>
        <th align="left">Product</th>
        <th align="right">Price</th>
      </tr>
    </thead>
    <tbody>
      <#list products as product>
        <tr>
          <td>\${product.name!"Unnamed Item"}</td>
          <td align="right">
            <#if product.onSale!false>
              <span style="color: #ef4444; font-weight: bold;">\${product.salePrice?string.currency}</span>
              <del style="color: #71717a; font-size: 12px; margin-left: 5px;">\${product.price?string.currency}</del>
            <#else>
              \${product.price?string.currency}
            </#if>
          </td>
        </tr>
      </#list>
    </tbody>
  </table>
<#else>
  <p class="no-items">No products found in your shopping cart.</p>
</#if>`;
      explanation = `1. **Presence Check**: \`<#if products?has_content>\` verifies that the product list is not null and contains at least one item before rendering.
2. **Iteration Block**: \`<#list products as product>\` loops through the list.
3. **Sale Price Logic**: Checks \`product.onSale!false\`. If true, displays the sale price in red and details the original price with a strike-through.
4. **Formatting**: Uses \`?string.currency\` built-in to properly format currency strings.`;
    } else {
      generatedCode = `<#-- Basic conditional logic for user greetings with parent-level null-safety check -->
<#if (user.firstName)?has_content>
  Hello, \${(user.firstName)!}!
<#else>
  Welcome, \${(user.fallbackGreeting)!"Valued Customer"}!
</#if>`;
      explanation = `1. **Presence Check**: We use \`(user.firstName)?has_content\` to verify that \`user\` and \`user.firstName\` are defined and not empty, avoiding crashes if the \`user\` object itself is missing.
2. **Parent-Safe Interpolation**: Wrapping interpolation paths in parentheses \`\${(user.fallbackGreeting)!"Valued Customer"}\` ensures full safety against missing parent scopes.`;
    }

    return { code: generatedCode, explanation: body.explain ? explanation : '', isMock: true };
  } else if (mode === 'modify') {
    const originalCode = body.code || '';
    const inst = (body.instructions || '').toLowerCase();
    let modifiedCode = originalCode;

    if (inst.includes('vip') || inst.includes('loyalty') || inst.includes('points')) {
      modifiedCode = `<#if ((user.isVip)!false)>
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fef08a; color: #854d0e;">
    <tr>
      <td style="padding: 10px; font-family: sans-serif; font-size: 14px;">
        <strong>VIP Member Status Verified</strong> - Loyalty Points: \${(user.loyaltyPoints)!0}
      </td>
    </tr>
  </table>
</#if>
${originalCode}`;
    } else if (inst.includes('border') || inst.includes('table') || inst.includes('wrap') || inst.includes('gray')) {
      modifiedCode = `<table border="1" cellpadding="15" cellspacing="0" width="100%" style="border-collapse: collapse; border-color: #e4e4e7; background-color: #fafafa;">
  <tr>
    <td style="font-family: sans-serif; font-size: 14px; color: #111111;">
      ${originalCode.trim().split('\n').join('\n      ')}
    </td>
  </tr>
</table>`;
    } else {
      modifiedCode = `<#-- Modified: ${body.instructions || 'Applied changes'} -->\n${originalCode}`;
    }

    return { code: modifiedCode, isMock: true };
  } else if (mode === 'audit') {
    const code = body.code || '';
    const issues = [];
    
    // Simulate syntax audits
    if (!code.includes('</#if>') && code.includes('<#if')) {
      issues.push({
        severity: 'error',
        line: 1,
        message: 'Missing closing tag </#if> for conditional statement.',
        suggestion: 'Ensure every opening <#if> is matched with a corresponding </#if> tag.'
      });
    }

    if (!code.includes('</#list>') && code.includes('<#list')) {
      issues.push({
        severity: 'error',
        line: 1,
        message: 'Missing closing tag </#list> for loop statement.',
        suggestion: 'Ensure every opening <#list> is matched with a corresponding </#list> tag.'
      });
    }

    // Check for null-handling
    const variableMatches = code.match(/\$\{[a-zA-Z0-9_.]+\}/g) || [];
    for (const match of variableMatches) {
      if (!match.includes('!') && !match.includes('??') && !match.includes('?has_content')) {
        issues.push({
          severity: 'warning',
          message: `Variable interpolation \`${match}\` is missing null-handling operators.`,
          suggestion: `Add the exclamation mark default fallback operator: \`\${${match.slice(2, -1)}!""}\` or check its presence with <#if ${match.slice(2, -1)}??>`
        });
      }
    }

    // Check for performance bottleneck
    if (code.includes('<#list') && code.includes('?filter(')) {
      issues.push({
        severity: 'info',
        message: 'Filtering lists inline within loops can slow down email compilation speeds.',
        suggestion: 'Consider filtering arrays in your integration layer or pre-computing subsets using <#assign>.'
      });
    }

    return {
      isValid: issues.length === 0,
      issues: issues,
      isMock: true
    };
  }

  return { error: 'Unknown mode' };
}
