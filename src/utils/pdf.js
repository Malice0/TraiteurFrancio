import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result || ''
      resolve(String(result).split(',')[1] || '')
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function generatePdfFromElement(element, fileName) {
  if (!element) {
    throw new Error("L'aperçu PDF est introuvable.")
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
  })

  const imageData = canvas.toDataURL('image/jpeg', 0.98)
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imageWidth = pageWidth
  const imageHeight = (canvas.height * imageWidth) / canvas.width

  let heightLeft = imageHeight
  let position = 0

  pdf.addImage(imageData, 'JPEG', 0, position, imageWidth, imageHeight)
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    position = heightLeft - imageHeight
    pdf.addPage()
    pdf.addImage(imageData, 'JPEG', 0, position, imageWidth, imageHeight)
    heightLeft -= pageHeight
  }

  const blob = pdf.output('blob')
  const base64 = await blobToBase64(blob)

  return {
    fileName,
    mimeType: 'application/pdf',
    base64,
  }
}
