on run argv
	set recipientEmail to item 1 of argv
	set subjectLine to item 2 of argv
	set bodyText to item 3 of argv
	
	tell application "Mail"
		set newMessage to make new outgoing message with properties {subject:subjectLine, content:bodyText, visible:false}
		tell newMessage
			make new recipient at end of recipients with properties {address:recipientEmail}
			send
		end tell
	end tell
end run
