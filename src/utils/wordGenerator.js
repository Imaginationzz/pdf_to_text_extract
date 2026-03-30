import { Document, Paragraph, TextRun, Packer, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

export async function generateWordDocument(text, filename = 'مستند-النص-المستخرج.docx') {
  // Split the text into lines and filter completely empty ones to avoid strange layout gaps
  const paragraphs = text.split('\n').filter(line => line.trim().length > 0).map(line => {
    return new Paragraph({
      alignment: AlignmentType.RIGHT,
      bidi: true, // Force Paragraph RTL Context
      children: [
        new TextRun({
          text: line,
          rightToLeft: true, // Force Text Direction
          font: {
            name: "Arial",
            cs: "Arial",
          },
          size: 28, // 14pt 
          sizeComplexScript: 28,
        }),
      ],
    });
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            rightToLeft: true,
            font: "Arial",
            size: 28,
          },
          paragraph: {
            bidi: true,
            alignment: AlignmentType.RIGHT,
          },
        },
      },
    },
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}
