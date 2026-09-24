require 'yaml'
require 'uri'

errors = []
data = {}
Dir['_data/*.yml'].sort.each do |path|
  begin
    data[File.basename(path, '.yml')] = YAML.load_file(path)
  rescue StandardError => e
    errors << "#{path}: #{e.message}"
  end
end

required_locale = %w[nav_links nav_support nav_projects nav_posts posts_empty projects_empty not_found back_home badge_live badge_new post_newer post_older skip_to_links skip_to_content sound_mute sound_unmute close new_tab post_content post_loading post_navigation code_block badge_privacy_note social_empty donate_empty]
required_locale.each { |key| errors << "_data/locale.yml: missing #{key}" unless data.dig('locale', key) }

known_sections = %w[hero bio projects socials donate articles]
Array(data.dig('sections')).each do |section|
  errors << "_data/sections.yml: unknown section type #{section['type'].inspect}" unless known_sections.include?(section['type'])
end

safe_url = lambda do |value, where|
  next if value.nil? || value.to_s.empty?
  uri = URI.parse(value.to_s)
  next if uri.scheme.nil? || %w[http https mailto tel].include?(uri.scheme.downcase)
  errors << "#{where}: unsupported URL scheme #{uri.scheme.inspect}"
rescue URI::InvalidURIError
  errors << "#{where}: invalid URL #{value.inspect}"
end

safe_url.call(data.dig('profile', 'owner_url'), '_data/profile.yml: owner_url')
safe_url.call(data.dig('profile', 'avatar'), '_data/profile.yml: avatar')
%w[social donate projects].each do |file|
  Array(data.dig(file, 'items')).each_with_index do |item, index|
    safe_url.call(item['url'], "_data/#{file}.yml: item #{index} url")
    badge = item['badge']
    next unless badge
    errors << "_data/#{file}.yml: item #{index} has unknown badge type #{badge['type'].inspect}" unless %w[twitch youtube telegram].include?(badge['type'])
    if badge['type'] == 'twitch' && badge['login'].to_s.empty?
      errors << "_data/#{file}.yml: item #{index} Twitch badge needs login"
    elsif badge['type'] == 'youtube' && badge['channel_id'].to_s.empty?
      errors << "_data/#{file}.yml: item #{index} YouTube badge needs channel_id"
    elsif badge['type'] == 'telegram' && badge['channel'].to_s.empty?
      errors << "_data/#{file}.yml: item #{index} Telegram badge needs channel"
    end
  end
end

if errors.empty?
  puts 'data validation: OK'
else
  errors.each { |error| warn "FAIL #{error}" }
  abort "#{errors.length} data validation error(s)"
end
