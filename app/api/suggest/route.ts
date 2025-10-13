  try {
    const r = await openai.chat.completions.create({
      model,
      temperature: field === 'testimonials' ? 0.6 : 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    // ⚙️ Tratamento especial para depoimentos JSON
    if (field === 'testimonials') {
      let text = r.choices?.[0]?.message?.content?.trim() || '[]';
      text = text.replace(/```json|```/g, '').trim();
      try {
        const arr = JSON.parse(text);
        return Response.json({ ok: true, provider: 'openai', suggestion: arr });
      } catch {
        const lines = text.split('\n').filter(l => l.trim());
        const arr = lines.slice(0, 3).map((l, i) => ({
          text: l.replace(/^\d+[\.\-)]\s*/, ''),
          author: `Cliente ${i + 1}`
        }));
        return Response.json({ ok: true, provider: 'openai', suggestion: arr });
      }
    }

    // ✂️ Limpeza de texto genérico
    let suggestion = r.choices?.[0]?.message?.content?.trim() || '';
    suggestion = suggestion
      .replace(/^Com base.*?(nicho|título).*?:/gi, '')
      .replace(/^"|"$/g, '')
      .replace(/^[-–•\s]+/, '')
      .replace(/\n/g, ' ')
      .trim();
    if (suggestion.length > 150) {
      const dot = suggestion.indexOf('.') + 1;
      suggestion = dot > 0 ? suggestion.slice(0, dot).trim() : suggestion.slice(0, 100) + '...';
    }

    return Response.json({ ok: true, provider: 'openai', suggestion });

  } catch (e: any) {
    console.error('Erro GPT Suggest:', e);
    return Response.json(
      { ok: false, error: e?.message || 'Falha na sugestão' },
      { status: 500 }
    );
  }
