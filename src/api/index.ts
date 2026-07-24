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
  deleteMediaFileRequest,
  retryTranscodeRequest
} from './media.service';
export type { MediaAssetResponseDto, UploadMediaProgress } from './media.service';
export type {
  ApiErrorCode,
  ApiRequestOptions,
  ApiResponse,
  AuthUserDto,
  LoginRequestDto,
  LoginResponseDto,
  SignUpRequestDto,
} from './types';
