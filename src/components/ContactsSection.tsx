'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Contact = {
  contacts_heading: string;
  contacts_text: string;
  instagram_url: string;
  instagram_label: string;
  phone: string;
  email: string;
};

const fallback: Contact = {
  contacts_heading: "Зв'яжіться з нами",
  contacts_text: 'Напишіть нам у Instagram, щоб замовити виріб або поставити запитання.',
  instagram_url: 'https://instagram.com/mini.mihandmade',
  instagram_label: '@mini.mihandmade',
  phone: '',
  email: '',
};

export default function Contacts() {
  const [c, setC] = useState<Contact>(fallback);

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('contacts_heading, contacts_text, instagram_url, instagram_label, phone, email')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data) setC({
          contacts_heading: data.contacts_heading || fallback.contacts_heading,
          contacts_text: data.contacts_text || fallback.contacts_text,
          instagram_url: data.instagram_url || fallback.instagram_url,
          instagram_label: data.instagram_label || fallback.instagram_label,
          phone: data.phone || '',
          email: data.email || '',
        });
      });
  }, []);

  return (
    <section id="contacts" className="bg-brand-soft/10 py-16">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-3xl font-extrabold text-brand-dark">{c.contacts_heading}</h2>
        <p className="mt-3 text-foreground/70">{c.contacts_text}</p>
        <a href={c.instagram_url} target="_blank" rel="noreferrer" className="mt-6 inline-block rounded-lg bg-brand px-8 py-3 font-semibold text-white transition hover:bg-brand-dark">{c.instagram_label}</a>
        {(c.phone || c.email) && (
          <div className="mt-6 space-y-1 text-foreground/70">
            {c.phone && (<p>{c.phone}</p>)}
            {c.email && (<p><a href={`mailto:${c.email}`} className="text-brand hover:underline">{c.email}</a></p>)}
          </div>
        )}
      </div>
    </section>
  );
}
