import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as storage from '../../__uts_mirror__/utils/storage'

describe('storage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('get', () => {
    it('returns value from uni.getStorageSync', () => {
      uni.getStorageSync.mockReturnValue('test_value')
      expect(storage.get('key')).toBe('test_value')
      expect(uni.getStorageSync).toHaveBeenCalledWith('key')
    })

    it('stringifies non-string values', () => {
      uni.getStorageSync.mockReturnValue({ name: 'test' })
      expect(storage.get('key')).toBe('{"name":"test"}')
    })

    it('returns null when storage returns empty', () => {
      uni.getStorageSync.mockReturnValue('')
      expect(storage.get('key')).toBeNull()
    })

    it('returns null on error', () => {
      uni.getStorageSync.mockImplementation(() => { throw new Error('fail') })
      expect(storage.get('key')).toBeNull()
    })
  })

  describe('set', () => {
    it('calls uni.setStorageSync and returns true', () => {
      expect(storage.set('key', { name: 'test' })).toBe(true)
      expect(uni.setStorageSync).toHaveBeenCalledWith('key', '{"name":"test"}')
    })

    it('stores string values directly', () => {
      expect(storage.set('key', 'value')).toBe(true)
      expect(uni.setStorageSync).toHaveBeenCalledWith('key', 'value')
    })

    it('returns false on error', () => {
      uni.setStorageSync.mockImplementation(() => { throw new Error('fail') })
      expect(storage.set('key', 'value')).toBe(false)
    })
  })

  describe('remove', () => {
    it('calls uni.removeStorageSync and returns true', () => {
      expect(storage.remove('key')).toBe(true)
      expect(uni.removeStorageSync).toHaveBeenCalledWith('key')
    })

    it('returns false on error', () => {
      uni.removeStorageSync.mockImplementation(() => { throw new Error('fail') })
      expect(storage.remove('key')).toBe(false)
    })
  })
})
