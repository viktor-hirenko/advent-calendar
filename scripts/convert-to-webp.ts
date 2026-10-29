#!/usr/bin/env tsx

import { readdir, stat } from 'fs/promises'
import { join, extname, basename, dirname } from 'path'
import sharp from 'sharp'
import { resolveCampaign } from './campaign.mjs'

const campaign = resolveCampaign()
const IMAGES_DIR = campaign.imagesDir
const SUPPORTED_EXTENSIONS = ['.png', '.jpg', '.jpeg']

/**
 * Converts all PNG, JPG, and JPEG images in the active campaign's images directory to WebP format.
 * Recursively processes subdirectories and maintains the original file structure.
 */
async function convertToWebP() {
  console.log(`🖼️  Converting images to WebP (campaign: ${campaign.id})...`)

  try {
    let convertedCount = 0

    /**
     * Processes a directory, converting all supported images to WebP.
     * @param dirPath - Path to the directory to process
     */
    async function processDirectory(dirPath: string) {
      const files = await readdir(dirPath)

      for (const file of files) {
        const filePath = join(dirPath, file)
        const fileStat = await stat(filePath)

        if (fileStat.isDirectory()) {
          // Recursively process subdirectories
          await processDirectory(filePath)
          continue
        }

        if (!fileStat.isFile()) continue

        const ext = extname(file).toLowerCase()
        if (!SUPPORTED_EXTENSIONS.includes(ext)) continue

        const nameWithoutExt = basename(file, ext)
        const webpPath = join(dirname(filePath), `${nameWithoutExt}.webp`)

        try {
          await sharp(filePath).webp({ quality: 85, effort: 4 }).toFile(webpPath)

          console.log(`✅ Converted: ${file} → ${nameWithoutExt}.webp`)
          convertedCount++
        } catch (error) {
          console.error(`❌ Failed to convert ${file}:`, error)
        }
      }
    }

    await processDirectory(IMAGES_DIR)
    console.log(`🎉 Conversion complete! Converted ${convertedCount} images to WebP.`)
  } catch (error) {
    console.error('❌ Error reading images directory:', error)
    process.exit(1)
  }
}

convertToWebP()
