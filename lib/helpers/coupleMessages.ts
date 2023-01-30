import Message from '../classes/message';

export default function coupleMessages(messages: Message[]) {
  // couple messages to an array if:
  // 1. coupled messages should be only from the same author
  // 2. the message createdAt date in a group must be within 5 minutes each
  // 3. each group only can hold 10 messages

  const groups: Message[][] = [];
  let group: Message[] = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const message of messages) {
    if (
      group.length === 0 ||
      group[0].author !== message.author ||
      message.createdAt.getTime() - group[0].createdAt.getTime() > 5 * 60 * 1000 ||
      group.length >= 10
    ) {
      if (group.length > 0) groups.push(group);
      group = [];
    }

    group.push(message);
  }

  if (group.length > 0) groups.push(group);

  return groups;
}