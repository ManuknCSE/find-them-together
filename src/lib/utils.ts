import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function mapBackendCaseToFrontend(c: any): any {
  return {
    id: c.caseId || c._id,
    _id: c._id,
    name: c.missingPersonName,
    age: c.age,
    gender: c.gender === 'male' ? 'Male' : c.gender === 'female' ? 'Female' : 'Other',
    lastSeen: c.lastSeenDate ? c.lastSeenDate.split('T')[0] : '',
    location: c.lastSeenLocation?.address || '',
    city: c.lastSeenLocation?.city || '',
    state: c.lastSeenLocation?.state || '',
    reward: c.rewardAmount || 0,
    status: c.caseStatus === 'active' || c.caseStatus === 'matched' ? 'Active' 
          : c.caseStatus === 'resolved' ? 'Found' 
          : 'Under Review',
    firVerified: c.caseStatus !== 'pending_verification' && c.caseStatus !== 'draft',
    aiMatch: c.aiMatchStatus === 'match_found' ? 'Match Found'
           : c.aiMatchStatus === 'scanning' || c.aiMatchStatus === 'queued' ? 'Pending'
           : c.aiMatchStatus === 'no_match' ? 'No Match'
           : 'Pending',
    description: c.lastSeenClothing ? `Last seen wearing ${c.lastSeenClothing}.` : 'No description provided.',
    image: c.uploadedPhotos?.[0]?.url || 'https://placehold.co/800x600/6c5ce7/ffffff?text=No+Photo',
    reportedAt: c.createdAt ? c.createdAt.split('T')[0] : '',
    familyContactDetails: c.familyContactDetails,
    createdBy: c.createdBy,
  };
}
