'use server'

import { createAd } from '../../actions/adActions'
import ClientAdsCreatePage from './ClientAdsCreatePage'

export default async function AdsCreatePage() {
    return <ClientAdsCreatePage />
}
