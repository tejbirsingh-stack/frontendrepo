export { apiClient, apiRequest } from './client';
export {
  fetchCurrentUserRequest,
  loginRequest,
  logoutRequest,
  mapAuthUserDtoToSessionUser,
  signUpRequest,
} from './auth.service';
export { ApiError } from './types';
export {
  uploadMediaFileRequest,
  getMediaAssetsRequest,
  getMediaAssetByIdRequest,
  updateAssetTagsRequest,
  updateAssetReviewStatusRequest,
  deleteMediaFileRequest,
  retryTranscodeRequest,
  getAssetAccessOverrides,
  updateAssetAccessOverride,
  removeAssetAccessOverride,
  updateAssetGroupAccessOverride,
  removeAssetGroupAccessOverride,
  getSharedMediaAssetsRequest
} from './media.service';
export {
  getTranscriptRequest,
  getAiStatusRequest,
  retryAiAnalyzeRequest,
  searchAiRequest,
  searchAiTranscriptRequest,
  getAiHighlightsRequest,
  listAiTagsRequest,
} from './ai.service';
export type {
  TranscriptSegmentDto,
  TranscriptResponseDto,
  AiStatusResponseDto,
  AiSearchHitDto,
  AiHighlightsResponseDto,
  AiAnalyzeFeature,
} from './ai.service';
export type { MediaAssetResponseDto, UploadMediaProgress } from './media.service';
export {
  toggleFavoriteRequest,
  getFavoritesRequest,
} from './favorites.service';
export type { ToggleFavoriteDto } from './favorites.service';
export type {
  ApiErrorCode,
  ApiRequestOptions,
  ApiResponse,
  AuthUserDto,
  LoginRequestDto,
  LoginResponseDto,
  SignUpRequestDto,
} from './types';
export {
  getCompanyInfoRequest,
  updateCompanyInfoRequest,
  uploadCompanyLogoRequest,
  getBrandingSettingsApi,
  updateBrandingSettingsApi,
  uploadBrandingHeaderRequest,
} from './organizations.service';
export type { UpdateCompanyInfoDto, UploadCompanyLogoResponse } from './organizations.service';
export {
  updateProfileRequest,
  uploadProfilePhotoRequest,
} from './users.service';
export type { UpdateProfileDto, UploadProfilePhotoResponse } from './users.service';
