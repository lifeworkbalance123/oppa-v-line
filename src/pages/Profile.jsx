import { useAuth } from '../App'
import ProfileCard from '../components/ProfileCard'
import './TabPage.css'

function Profile() {
  const { user, signOut } = useAuth()

  return (
    <section className="tab-page">
      <ProfileCard user={user} />
      {user && (
        <button
          type="button"
          className="tab-page__btn profile-page__signout"
          onClick={signOut}
        >
          Sign out
        </button>
      )}
    </section>
  )
}

export default Profile
