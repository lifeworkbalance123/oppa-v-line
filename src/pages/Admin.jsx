import AdminPanel from '../components/AdminPanel'
import PdfGuidesAdmin from '../components/PdfGuidesAdmin'
import './TabPage.css'

function Admin() {
  return (
    <section className="tab-page">
      <AdminPanel />
      <PdfGuidesAdmin />
    </section>
  )
}

export default Admin
