import { practiceText } from './data/text';

type Passage = { tibetan?: string; transliteration?: string; polish?: string };
type Instruction = string | Passage;

function Lines({ text }: { text: Passage }) {
  return <>
    {text.tibetan && <span className="tib" lang="bo">{text.tibetan}</span>}
    {text.transliteration && <span className="pho">{text.transliteration}</span>}
    {text.polish && <span className="pl">{text.polish}</span>}
  </>;
}

function Note({ text }: { text: Instruction }) {
  return <p className="instruction"><Lines text={typeof text === 'string' ? { polish: text } : text} /></p>;
}

export default function Practice() {
  return <>
    <header className="title-page">
      <h1><Lines text={practiceText.title} /></h1>
      {practiceText.subtitles.map(text => <p className="pl" key={text}>{text}</p>)}
    </header>
    {practiceText.sections.map(section => <section id={section.id} key={section.id}>
      {section.title && <h2><Lines text={section.title} /></h2>}
      {section.verses.map((v, i) => <p className="verse" key={i}><Lines text={v} /></p>)}
      {section.mantra && <p className="mantra"><Lines text={section.mantra} /></p>}
      {section.instruction && <Note text={section.instruction} />}
      {section.postMantraInstruction && <Note text={section.postMantraInstruction} />}
      {section.postMantraVerses?.map((v, i) => <p className="verse" key={i}><Lines text={v} /></p>)}
      {section.finalInstructions?.map((text, i) => <Note key={i} text={text} />)}
      {section.footnote && <p className="pl footnote">{section.footnote}</p>}
      {section.instructions?.map((text, i) => <Note key={i} text={text} />)}
    </section>)}
    <footer>
      {practiceText.colophon.map(text => <p key={text}>{text}</p>)}
      <address>Projekt aplikacji: Andrzej R. Rybszleger<br />
        <a href="mailto:rybszlegerr@gmail.com">rybszlegerr@gmail.com</a>
      </address>
    </footer>
  </>;
}
